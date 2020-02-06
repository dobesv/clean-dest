"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const globby_1 = tslib_1.__importDefault(require("globby"));
const del_1 = tslib_1.__importDefault(require("del"));
const trash_1 = tslib_1.__importDefault(require("trash"));
class CleanDestination {
    /**
     * @param config Configuration
     * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
     * @param importUtil Import function
     */
    constructor(config, delUtil, importUtil) {
        const defaultDeleteUtility = (patterns, options) => {
            if (config.permanent) {
                return del_1.default(patterns, options);
            }
            return trash_1.default(patterns);
        };
        const defaultFileMapImport = (fileMapPath) => {
            const resolvedPath = path_1.default.resolve(fileMapPath);
            this.log('Imported file map', resolvedPath);
            return Promise.resolve().then(() => tslib_1.__importStar(require(resolvedPath)));
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
        const { srcRootPath, destRootPath, fileMapPath, basePattern } = this._config;
        const fileMap = fileMapPath
            ? await this._importUtil(fileMapPath)
            : null;
        const srcPath = path_1.default.posix.join(srcRootPath, '**', '*');
        this.log('Matching source', srcPath);
        const srcFilePaths = await globby_1.default(srcRootPath, {
            markDirectories: true,
            onlyFiles: false
        });
        this.log('Matched source files', srcFilePaths);
        const defaultBasePattern = path_1.default.posix.join(destRootPath, '**', '*');
        const destFilePaths = [basePattern || defaultBasePattern];
        for (const srcFilePath of srcFilePaths) {
            const destFilePath = this.mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap);
            this.log('Mapped src to dest', { srcFilePath, destFilePath });
            if (typeof destFilePath === 'string') {
                destFilePaths.push('!' + destFilePath);
            }
            else if (destFilePath !== null) {
                destFilePaths.push(...destFilePath.map(d => '!' + d));
            }
        }
        this.log('Matching destination files', destFilePaths);
        const deleted = await this._delUtil(destFilePaths, {
            dryRun: this._config.dryRun
        });
        if (deleted) { // TODO: Deletd for trash?
            this.log('Deleted files', deleted);
            return deleted;
        }
    }
    mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap) {
        const destFilePath = this.mapSrcToDestPath(srcFilePath, srcRootPath, destRootPath);
        const isDirectory = srcFilePath.endsWith('/');
        if (isDirectory || fileMap === null) {
            return destFilePath;
        }
        if (typeof fileMap === 'string') {
            if (!destFilePath.endsWith(fileMap)) {
                return null;
            }
            return destFilePath;
        }
        const extension = path_1.default.extname(destFilePath);
        if (extension in fileMap) {
            const mapProvider = fileMap[extension];
            return mapProvider(destFilePath);
        }
        return null;
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