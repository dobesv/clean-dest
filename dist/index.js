"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanDestination = exports.parseFileMapString = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const del_1 = tslib_1.__importDefault(require("del"));
const trash_1 = tslib_1.__importDefault(require("trash"));
const module_1 = require("module");
// Split a string around a separator, trimming each string's starting and ending whitespace and then
// removing any empty (or all whitespace) elements.
const splitAndTrim = (s, sep) => s
    .split(sep)
    .map((part) => part.trim())
    .filter(Boolean);
const parseFileMapString = (extMapString) => normalizeFileMap(splitAndTrim(extMapString, ';').flatMap((extEntry) => {
    const [srcExtString, destExtString] = splitAndTrim(extEntry, ':');
    const srcExts = splitAndTrim(srcExtString, ',');
    const destExts = destExtString
        ? splitAndTrim(destExtString, ',')
        : srcExts;
    return (destFilePath) => {
        const ext = srcExts.find((srcExt) => destFilePath.endsWith(srcExt));
        if (ext) {
            const pathBase = destFilePath.substring(0, destFilePath.length - ext.length);
            return destExts.map((destExt) => pathBase + destExt);
        }
        else {
            return [];
        }
    };
}));
exports.parseFileMapString = parseFileMapString;
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
const normalizeFileMap = (fileMap, replaceExt = null) => {
    if (!fileMap) {
        return (path) => [path];
    }
    if (typeof fileMap === 'string') {
        if (replaceExt) {
            return (destFilePath) => destFilePath.endsWith(replaceExt)
                ? [
                    destFilePath.substring(0, destFilePath.length - replaceExt.length) + fileMap,
                ]
                : [];
        }
        return (0, exports.parseFileMapString)(fileMap);
    }
    if (Array.isArray(fileMap)) {
        return fileMap
            .map((elt) => normalizeFileMap(elt, replaceExt))
            .reduce((mapFn1, mapFn2) => (destFilePath) => Array.from(new Set([...mapFn1(destFilePath), ...mapFn2(destFilePath)])));
    }
    if (fileMap && typeof fileMap === 'object') {
        return normalizeFileMap(Object.entries(fileMap).map(([ext, replacement]) => {
            const fn = normalizeFileMap(replacement, ext);
            return (destFilePath) => destFilePath.endsWith(ext) ? fn(destFilePath) : [];
        }));
    }
    return fileMap;
};
class CleanDestination {
    /**
     * @param config Configuration
     * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
     * @param importUtil Import function
     */
    constructor(config, delUtil, importUtil) {
        const defaultDeleteUtility = (patterns, options) => {
            if (config.permanent) {
                return (0, del_1.default)(patterns, options);
            }
            return (0, trash_1.default)(patterns);
        };
        const defaultFileMapImport = (fileMapPath) => {
            const targetRequire = (0, module_1.createRequire)(path_1.default.resolve(process.cwd(), 'package.json'));
            return targetRequire(targetRequire.resolve(fileMapPath));
        };
        this._config = config;
        this._delUtil = delUtil || defaultDeleteUtility;
        this._importUtil = importUtil || defaultFileMapImport;
    }
    /**
     * Execute the clean destination function
     */
    async execute() {
        this.log('Executing, using config', this._config);
        const { srcRootPath, destRootPath, fileMapArgument, basePattern } = this._config;
        const fileMap = normalizeFileMap(fileMapArgument
            ? /^[.][a-z0-9]/i.test(fileMapArgument)
                ? (0, exports.parseFileMapString)(fileMapArgument)
                : await this._importUtil(fileMapArgument)
            : '');
        const srcPath = path_1.default.posix.join(srcRootPath, '**', '*');
        this.log('Matching source', srcPath);
        const srcFilePaths = await (0, globby_1.default)(srcRootPath, {
            markDirectories: true,
            onlyFiles: false,
        });
        this.log('Matched source files', srcFilePaths);
        const defaultBasePattern = path_1.default.posix.join(destRootPath, '**', '*');
        const destFilePaths = [basePattern || defaultBasePattern];
        for (const srcFilePath of srcFilePaths) {
            const destFilePath = this.mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap);
            this.log('Mapped src to dest', { srcFilePath, destFilePath });
            destFilePaths.push(...destFilePath.map((d) => '!' + d));
        }
        this.log('Matching destination files', destFilePaths);
        const deleted = await this._delUtil(destFilePaths, {
            dryRun: this._config.dryRun,
        });
        if (deleted) {
            this.log('Deleted files', deleted);
            return deleted;
        }
    }
    mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMapFn) {
        const destFilePath = this.mapSrcToDestPath(srcFilePath, srcRootPath, destRootPath);
        const isDirectory = srcFilePath.endsWith('/');
        if (isDirectory || fileMapFn === null) {
            return [destFilePath];
        }
        return fileMapFn(destFilePath);
    }
    mapSrcToDestPath(srcFilePath, srcRootPath, destRootPath) {
        const fullAppSrcPath = path_1.default.resolve(srcRootPath);
        const relativeSrcPath = path_1.default.relative(fullAppSrcPath, srcFilePath);
        // Globs only use '/' so we change windows backslash
        return path_1.default.join(destRootPath, relativeSrcPath).replace(/\\/g, '/');
    }
    log(message, ...optionalArgs) {
        if (this._config.verbose) {
            console.log(message, ...optionalArgs);
        }
    }
}
exports.CleanDestination = CleanDestination;
//# sourceMappingURL=index.js.map