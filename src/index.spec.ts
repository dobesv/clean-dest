import { describe, it } from 'mocha';
import { strict as assert } from 'assert';

import { CleanDestination, CleanDestinationConfig, FileMapImport, Delete, FileMap } from './index';

describe(CleanDestination.name, () => {

	const defaultDelUtil: Delete = () => Promise.resolve([]);
	const defaultImportUtil: FileMapImport = () => Promise.resolve({});

	function createSUT(config?: Partial<CleanDestinationConfig>, delUtil?: Delete, importUtil?: FileMapImport): CleanDestination {

		const defaultConfig: CleanDestinationConfig = {
			srcRootPath: './src',
			destRootPath: './dest',
			basePattern: null,
			fileMapPath: null,
			permanent: true,
			verbose: true,
			dryRun: true
		};
		return new CleanDestination(Object.assign(defaultConfig, config), delUtil || defaultDelUtil, importUtil || defaultImportUtil);
	}

	describe('constructor', () => {

		it('exists', () => {

			const sut = createSUT();
			assert.ok(sut);
		});
	});

	describe(CleanDestination.prototype.execute.name, () => {

		describe('given typescript file map', () => {

			const tsFileMap: FileMap = {
				'.ts': (destFilePath) => [
					destFilePath.replace(/.js$/, '.d.ts'),
					destFilePath.replace(/.js$/, '.d.ts'),
					destFilePath.replace(/.js$/, '.d.ts')
				]
			};

			it('executes', async () => {

				const srcRootPath = './test/data/**/*';
				const sut = createSUT({ srcRootPath }, (patterns) => Promise.resolve(patterns), () => Promise.resolve(tsFileMap));
				const actual = await sut.execute();
				const expected: Array<string> = [
					'dest/**/*',
					'!../file1.ts',
					'!../file2.ts',
					'!../folder1',
					'!../folder2',
					'!../folder1/file3.ts',
					'!../folder2/file4.ts'
				];
				assert.deepStrictEqual(actual, expected);
			});
		});
	});
});
