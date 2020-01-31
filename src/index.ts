import path from 'path';
import globby from 'globby';
import del from 'del';

export interface CleanDestinationConfig {
	readonly srcRootPath: string;
	readonly destRootPath: string;
	readonly fileMapPath: string | null;
	readonly verbose: boolean;
	readonly dryRun: boolean;
}

export type FileMap = { readonly [extension: string]: (destFilePath: string) => string | ReadonlyArray<string> };
export type FileMapImport = (filePath: string) => Promise<FileMap>;
export type Del = (patterns: ReadonlyArray<string>) => Promise<ReadonlyArray<string>>;

export class CleanDestination {

	private readonly _config: CleanDestinationConfig;
	private readonly _delUtil: Del;
	private readonly _importUtil: FileMapImport;

	/**
	 * @param config Configuration
	 * @param delUtil [Del](https://www.npmjs.com/package/del-cli) library
	 * @param importUtil Import function
	 */
	public constructor(config: CleanDestinationConfig, delUtil: Del = del, importUtil: FileMapImport = (filePath: string): Promise<FileMap> => import(filePath)) {

		this._config = config;
		this._delUtil = delUtil;
		this._importUtil = importUtil;
	}

	/**
	 * Execute the clean destination function
	 */
	public async execute(): Promise<ReadonlyArray<string>> {

		const { srcRootPath, destRootPath, fileMapPath } = this._config;
		const fileMap = fileMapPath ? await this._importUtil(fileMapPath) : null;
		const srcFilePaths = await globby(srcRootPath);
		const destFilePaths = [];
		for (const srcFilePath of srcFilePaths) {
			const destFilePath = this.mapDestFile(srcFilePath, srcRootPath, destRootPath, fileMap);
			if (typeof destFilePath === 'string') {
				destFilePaths.push(destFilePath);
			} else if (destFilePath !== null) {
				destFilePaths.push(...destFilePath);
			}
		}
		if (this._config.dryRun) {
			return [];
		}
		return await this._delUtil(destFilePaths);
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
}
