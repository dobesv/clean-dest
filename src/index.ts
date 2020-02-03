import path from 'path';
import globby from 'globby';
import del from 'del';

export interface CleanDestinationConfig {
	readonly srcRootPath: string;
	readonly destRootPath: string;
	readonly basePattern: string | null;
	readonly fileMapPath: string | null;
	readonly verbose: boolean;
	readonly dryRun: boolean;
}

export type FileMap = { readonly [extension: string]: (destFilePath: string) => string | ReadonlyArray<string> };
export type FileMapImport = (filePath: string) => Promise<FileMap>;
export type Del = (patterns: ReadonlyArray<string>) => Promise<ReadonlyArray<string>>;
const defaultFileMapImport: FileMapImport = (filePath) => import(path.resolve(filePath));

export class CleanDestination {

	private readonly _config: CleanDestinationConfig;
	private readonly _delUtil: Del;
	private readonly _importUtil: FileMapImport;

	/**
	 * @param config Configuration
	 * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
	 * @param importUtil Import function
	 */
	public constructor(config: CleanDestinationConfig, delUtil: Del = del, importUtil: FileMapImport = defaultFileMapImport) {

		this._config = config;
		this._delUtil = delUtil;
		this._importUtil = importUtil;
	}

	/**
	 * Execute the clean destination function
	 */
	public async execute(): Promise<ReadonlyArray<string>> {

		this.log('Executing, using config', this._config);
		const { srcRootPath, destRootPath, fileMapPath, basePattern } = this._config;
		const fileMap = fileMapPath ? await this._importUtil(fileMapPath) : null;
		if (fileMap) {
			this.log('Imported file map', fileMapPath);
		}
		const srcFilePaths = await globby(srcRootPath);
		this.log('Matched source files', srcFilePaths);
		const defaultBasePattern =  path.join(srcRootPath, '**', '*');
		const destFilePaths = [basePattern ||defaultBasePattern];
		for (const srcFilePath of srcFilePaths) {
			const destFilePath = this.mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap);
			if (typeof destFilePath === 'string') {
				destFilePaths.push('!' + destFilePath);
			} else if (destFilePath !== null) {
				destFilePaths.push(...destFilePath.map(d => '!' + d));
			}
		}
		if (this._config.dryRun) {
			this.log('Matched destination files, dry run', destFilePaths);
			return [];
		}
		this.log('Matched destination files', destFilePaths);
		const deleted = await this._delUtil(destFilePaths);
		this.log('Deleted files', deleted);
		return deleted;
	}

	private mapDestFile(srcFilePath: string, srcRootPath: string, destRootPath: string, fileMap: FileMap | null): string | ReadonlyArray<string> | null {

		const destFilePath = this.mapSrcToDestPath(srcFilePath, srcRootPath, destRootPath);
		if (fileMap === null) {
			return destFilePath;
		}
		if (typeof fileMap === 'string') {
			if (!destFilePath.endsWith(fileMap)) {
				return null;
			}
			return destFilePath;
		}
		const extension = path.parse(destFilePath).ext;
		if (extension in fileMap) {
			const mapProvider = fileMap[extension];
			return mapProvider(destFilePath);
		}
		return null;
	}

	private mapSrcToDestPath(srcFilePath: string, srcRootPath: string, destRootPath: string): string {

		const fullAppSrcPath = path.resolve(srcRootPath);
		const fullAppDestPath = path.resolve(destRootPath);
		const relativeSrcPath = path.relative(fullAppSrcPath, srcFilePath);
		return path.resolve(fullAppDestPath, relativeSrcPath);
	}

	private log(message: string, ...optionalArgs: ReadonlyArray<any>): void {
		if (this._config.verbose) {
			console.log(message, ...optionalArgs);
		}
	}
}
