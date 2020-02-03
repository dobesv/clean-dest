import path from 'path';
import globby from 'globby';
import del from 'del';
import trash from 'trash';

export interface CleanDestinationConfig {
	readonly srcRootPath: string;
	readonly destRootPath: string;
	readonly basePattern: string | null;
	readonly fileMapPath: string | null;
	readonly permanent: boolean;
	readonly verbose: boolean;
	readonly dryRun: boolean;
}

export type FileMap = { readonly [extension: string]: (destFilePath: string) => string | ReadonlyArray<string> };
export type FileMapImport = (filePath: string) => Promise<FileMap>;
export type Delete = (patterns: ReadonlyArray<string>, options: { readonly dryRun: boolean }) => Promise<void | ReadonlyArray<string>>;

export class CleanDestination {

	private readonly _config: CleanDestinationConfig;
	private readonly _delUtil: Delete;
	private readonly _importUtil: FileMapImport;

	/**
	 * @param config Configuration
	 * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
	 * @param importUtil Import function
	 */
	public constructor(config: CleanDestinationConfig, delUtil?: Delete, importUtil?: FileMapImport) {

		const defaultDeleteUtility: Delete = (patterns, options) => {
			if (config.permanent) {
				return del(patterns, options);
			}
			return trash(patterns);
		};
		const defaultFileMapImport: FileMapImport = (fileMapPath) => {
			const resolvedPath = path.resolve(fileMapPath);
			this.log('Imported file map', resolvedPath);
			return import(resolvedPath);
		};
		this._config = config;
		this._delUtil = delUtil || defaultDeleteUtility;
		this._importUtil = importUtil || defaultFileMapImport;
	}

	/**
	 * Execute the clean destination function
	 */
	public async execute(): Promise<void> {

		this.log('Executing, using config', this._config);
		const { srcRootPath, destRootPath, fileMapPath, basePattern } = this._config;
		const fileMap = fileMapPath
			? await this._importUtil(fileMapPath)
			: null;
		const srcPath = path.posix.join(srcRootPath, '**', '*');
		this.log('Matching source', srcPath);
		const srcFilePaths = await globby(srcRootPath);
		this.log('Matched source files', srcFilePaths);
		const defaultBasePattern = path.posix.join(destRootPath, '**', '*');
		const destFilePaths = [basePattern ||defaultBasePattern];
		for (const srcFilePath of srcFilePaths) {
			const destFilePath = this.mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap);
			if (typeof destFilePath === 'string') {
				destFilePaths.push('!' + destFilePath);
			} else if (destFilePath !== null) {
				destFilePaths.push(...destFilePath.map(d => '!' + d));
			}
		}
		this.log('Matching destination files', destFilePaths);
		const deleted = await this._delUtil(destFilePaths, {
			dryRun: this._config.dryRun
		});
		if (deleted) { // TODO: Deletd for trash?
			this.log('Deleted files', deleted);
		}
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
		const relativeSrcPath = path.relative(fullAppSrcPath, srcFilePath);
		return path.join(destRootPath, relativeSrcPath).replace(/\\/g, '/');
	}

	private log(message: string, ...optionalArgs: ReadonlyArray<any>): void {
		if (this._config.verbose) {
			console.log(message, ...optionalArgs);
		}
	}
}
