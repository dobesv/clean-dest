import { describe, it } from 'mocha';
import { strict as assert } from 'assert';
import del from 'del';

import { CleanDestination, CleanDestinationConfig, FileMapImport, Del, FileMap } from './index';

describe(CleanDestination.name, () => {

	function createSUT(config?: Partial<CleanDestinationConfig>, delUtil?: typeof del, importUtil?: FileMapImport): CleanDestination {

		const defaultConfig: CleanDestinationConfig = {
			srcRootPath: '',
			destRootPath: '',
			basePattern: '',
			fileMapPath: null,
			verbose: true,
			dryRun: true
		};
		const fileMap: FileMap = {
		};
		const defaultDelUtil: Del = () => Promise.resolve([]);
		const defaultImportUtil: FileMapImport = () => Promise.resolve(fileMap);
		return new CleanDestination(Object.assign(defaultConfig, config), delUtil || defaultDelUtil, importUtil || defaultImportUtil);
	}

	describe('constructor', () => {

		it('exists', () => {

			const sut = createSUT();
			assert.ok(sut);
		});
	});

	describe(CleanDestination.prototype.execute.name, () => {

		it('executes', async () => {

			const srcRootPath = '/some/path/';
			const sut = createSUT({ srcRootPath });
			const actual = await sut.execute();
			const expected: Array<string> = [];
			assert.deepStrictEqual(actual, expected);
		});
	});
});
