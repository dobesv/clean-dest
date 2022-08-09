import path from 'path';
import globby from 'globby';
import del from 'del';
import trash from 'trash';
import { createRequire } from 'module';

export interface CleanDestinationConfig {
  readonly srcRootPath: string;
  readonly destRootPath: string;
  readonly basePattern: string | null;
  readonly fileMapArgument: string | null;
  readonly ignore: string | null;
  readonly permanent: boolean;
  readonly verbose: boolean;
  readonly dryRun: boolean;
}

/**
 * Either just a file extension or an object where the keys are file extensions and the values are either:
 *
 * 1. a file extension
 * 2. an array of file extensions
 * 3. a function that takes the a destination file path with the same extension as the source file and
 *    produces an array of potential output file names
 */
export type FileMapFunction = (destFilePath: string) => ReadonlyArray<string>;
export type FileMap =
  | string
  | FileMapFunction
  | ReadonlyArray<FileMap>
  | { [P in string]: FileMap };
export type FileMapImport = (filePath: string) => Promise<FileMap>;
export type Delete = (
  patterns: ReadonlyArray<string>,
  options: { readonly dryRun?: boolean; readonly force?: boolean }
) => Promise<void | ReadonlyArray<string>>;

// Split a string around a separator, trimming each string's starting and ending whitespace and then
// removing any empty (or all whitespace) elements.
const splitAndTrim = (s: string, sep: string): ReadonlyArray<string> =>
  s
    .split(sep)
    .map((part) => part.trim())
    .filter(Boolean);

export const parseFileMapString = (extMapString: string): FileMapFunction =>
  normalizeFileMap(
    splitAndTrim(extMapString, ';').flatMap((extEntry) => {
      const [srcExtString, destExtString] = splitAndTrim(extEntry, ':');
      const srcExts = splitAndTrim(srcExtString, ',');
      const destExts = destExtString
        ? splitAndTrim(destExtString, ',')
        : srcExts;
      return (destFilePath: string): ReadonlyArray<string> => {
        const ext = srcExts.find((srcExt) => destFilePath.endsWith(srcExt));
        if (ext) {
          const pathBase = destFilePath.substring(
            0,
            destFilePath.length - ext.length
          );
          return destExts.map((destExt) => pathBase + destExt);
        } else {
          return [];
        }
      };
    })
  );

// Convert a filemap value into a function
// If a single string argument is provided, it is parsed as a file map string argument.
// If two strings are given, it matches files with the second string as a suffix and replaces that
// suffix with the first string if it matches.
// A function passed through unchanged
// An array is the result of combining the results of all the array elements recursively processed
// with this function (preserving the second argument, if any)
// An object is the result of combining the results of all the entries in the object, processing each
// with this function passing the value as the first argument and the key as the second argument.
// If the argument is null or any empty string, this returns a function that matches all paths unchanged
const normalizeFileMap = (
  fileMap: FileMap,
  replaceExt: string | null = null
): FileMapFunction => {
  if (!fileMap) {
    return (path: string): ReadonlyArray<string> => [path];
  }
  if (typeof fileMap === 'string') {
    if (replaceExt) {
      return (destFilePath: string): ReadonlyArray<string> =>
        destFilePath.endsWith(replaceExt)
          ? [
              destFilePath.substring(
                0,
                destFilePath.length - replaceExt.length
              ) + fileMap,
            ]
          : [];
    }
    return parseFileMapString(fileMap);
  }
  if (Array.isArray(fileMap)) {
    return fileMap
      .map((elt) => normalizeFileMap(elt, replaceExt))
      .reduce(
        (mapFn1, mapFn2) =>
          (destFilePath: string): ReadonlyArray<string> =>
            Array.from(
              new Set([...mapFn1(destFilePath), ...mapFn2(destFilePath)])
            ).sort()
      );
  }
  if (fileMap && typeof fileMap === 'object') {
    return normalizeFileMap(
      Object.entries(fileMap).map(([ext, replacement]) => {
        const fn = normalizeFileMap(replacement, ext);
        return (destFilePath: string): ReadonlyArray<string> =>
          destFilePath.endsWith(ext) ? fn(destFilePath) : [];
      })
    );
  }
  return fileMap;
};

export class CleanDestination {
  private readonly _config: CleanDestinationConfig;
  private readonly _delUtil: Delete;
  private readonly _importUtil: FileMapImport;

  /**
   * @param config Configuration
   * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
   * @param importUtil Import function
   */
  public constructor(
    config: CleanDestinationConfig,
    delUtil?: Delete,
    importUtil?: FileMapImport
  ) {
    const defaultDeleteUtility: Delete = (patterns, options) => {
      if (config.permanent) {
        return del(patterns, options);
      }
      return trash(patterns);
    };
    const defaultFileMapImport: FileMapImport = (fileMapPath) => {
      const targetRequire = createRequire(
        path.resolve(process.cwd(), 'package.json')
      );
      return targetRequire(targetRequire.resolve(fileMapPath));
    };
    this._config = config;
    this._delUtil = delUtil || defaultDeleteUtility;
    this._importUtil = importUtil || defaultFileMapImport;
  }

  /**
   * Execute the clean destination function
   */
  public async execute(): Promise<void | ReadonlyArray<string>> {
    this.log('Executing, using config', this._config);
    const { srcRootPath, destRootPath, fileMapArgument, basePattern, ignore } =
      this._config;
    const fileMap: FileMapFunction = normalizeFileMap(
      fileMapArgument
        ? /^[.][a-z0-9]/i.test(fileMapArgument)
          ? parseFileMapString(fileMapArgument)
          : await this._importUtil(fileMapArgument)
        : ''
    );
    const srcPath = path.posix.join(srcRootPath, '**', '*');
    this.log('Matching source', srcPath);
    const srcFilePaths = await globby(srcRootPath, {
      markDirectories: true,
      onlyFiles: false,
    });
    this.log('Matched source files', srcFilePaths);
    const defaultBasePattern = path.posix.join(destRootPath, '**', '*');
    const destFilePaths = [basePattern || defaultBasePattern];
    if (ignore) {
      destFilePaths.push(
        ...splitAndTrim(ignore, ';').map((rule) => '!' + rule)
      );
    }
    for (const srcFilePath of srcFilePaths) {
      const destFilePath = this.mapDestFile(
        srcFilePath,
        srcRootPath,
        destRootPath,
        fileMap
      );
      this.log('Mapped src to dest', { srcFilePath, destFilePath });
      destFilePaths.push(...destFilePath.map((d) => '!' + d));
    }
    this.log('Matching destination files', destFilePaths);
    const deleted = await this._delUtil(destFilePaths, {
      dryRun: this._config.dryRun,
      force: true,
    });
    if (deleted) {
      this.log('Deleted files', deleted);
      return deleted;
    }
  }

  private mapDestFile(
    srcFilePath: string,
    srcRootPath: string,
    destRootPath: string,
    fileMapFn: FileMapFunction
  ): ReadonlyArray<string> {
    const destFilePath = this.mapSrcToDestPath(
      srcFilePath,
      srcRootPath,
      destRootPath
    );
    const isDirectory = srcFilePath.endsWith('/');
    if (isDirectory || fileMapFn === null) {
      return [destFilePath];
    }
    return fileMapFn(destFilePath);
  }

  private mapSrcToDestPath(
    srcFilePath: string,
    srcRootPath: string,
    destRootPath: string
  ): string {
    const fullAppSrcPath = path.resolve(srcRootPath);
    const relativeSrcPath = path.relative(fullAppSrcPath, srcFilePath);
    // Globs only use '/' so we change windows backslash
    return path.join(destRootPath, relativeSrcPath).replace(/\\/g, '/');
  }

  private log(message: string, ...optionalArgs: ReadonlyArray<any>): void {
    if (this._config.verbose) {
      console.log(message, ...optionalArgs);
    }
  }
}
