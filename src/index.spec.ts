import { describe, it } from 'mocha';
import { strict as assert } from 'assert';

import {
  CleanDestination,
  CleanDestinationConfig,
  FileMapImport,
  Delete,
  FileMap,
} from './index';

describe(CleanDestination.name, () => {
  const defaultDelUtil: Delete = () => Promise.resolve([]);
  const defaultImportUtil: FileMapImport = () => Promise.resolve({});

  function createSUT(
    config?: Partial<CleanDestinationConfig>,
    delUtil?: Delete,
    importUtil?: FileMapImport
  ): CleanDestination {
    const defaultConfig: CleanDestinationConfig = {
      srcRootPath: './src',
      destRootPath: './dest',
      basePattern: null,
      fileMapArgument: null,
      ignore: null,
      permanent: true,
      verbose: true,
      dryRun: true,
    };
    return new CleanDestination(
      Object.assign(defaultConfig, config),
      delUtil || defaultDelUtil,
      importUtil || defaultImportUtil
    );
  }

  describe('constructor', () => {
    it('exists', () => {
      const sut = createSUT();
      assert.ok(sut);
    });
  });

  describe(CleanDestination.prototype.execute.name, () => {
    describe('given typescript file map', () => {
      it('executes', async () => {
        const tsFileMap: FileMap = {
          '.ts': (destFilePath) => [
            destFilePath.replace(/.ts$/, '.js'),
            destFilePath.replace(/.ts$/, '.js.map'),
            destFilePath.replace(/.ts$/, '.d.ts'),
          ],
        };

        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          { fileMapArgument: 'fake', srcRootPath },
          (patterns) => Promise.resolve(patterns),
          () => Promise.resolve(tsFileMap)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../file1.js',
          '!../file1.js.map',
          '!../file1.d.ts',
          '!../file2.js',
          '!../file2.js.map',
          '!../file2.d.ts',
          '!../folder1',
          '!../folder2',
          '!../folder1/file3.js',
          '!../folder1/file3.js.map',
          '!../folder1/file3.d.ts',
          '!../folder2/file4.js',
          '!../folder2/file4.js.map',
          '!../folder2/file4.d.ts',
        ];
        assert.deepStrictEqual(actual, expected);
      });

      it('only processes files with a mapping', async () => {
        const tsxFileMap: FileMap = {
          '.tsx': (destFilePath) => [destFilePath.replace(/.tsx$/, '.js')],
        };

        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          { fileMapArgument: 'fake', srcRootPath },
          (patterns) => Promise.resolve(patterns),
          () => Promise.resolve(tsxFileMap)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../folder1',
          '!../folder2',
          '!../folder2/file5.js',
        ];
        assert.deepStrictEqual(actual, expected);
      });
    });

    describe('given typescript file-map with just string export', () => {
      it('executes', async () => {
        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          { fileMapArgument: 'fake', srcRootPath },
          (patterns) => Promise.resolve(patterns),
          () => Promise.resolve('.ts')
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../file1.ts',
          '!../file2.ts',
          '!../folder1',
          '!../folder2',
          '!../folder1/file3.ts',
          '!../folder2/file4.ts',
        ];
        assert.deepStrictEqual(actual, expected);
      });

      it('does not exclude files with no mapping', async () => {
        const tsxFileMap: FileMap = {
          '.tsx': (destFilePath) => [destFilePath.replace(/.tsx$/, '.js')],
        };

        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          { fileMapArgument: 'fake', srcRootPath },
          (patterns) => Promise.resolve(patterns),
          () => Promise.resolve(tsxFileMap)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../folder1',
          '!../folder2',
          '!../folder2/file5.js',
        ];
        assert.deepStrictEqual(actual, expected);
      });
    });

    describe('given typescript ext map', () => {
      it('executes', async () => {
        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          {
            fileMapArgument: '.js,.ts,.tsx:.js,.js.map,.d.ts,.d.ts.map',
            srcRootPath,
          },
          (patterns) => Promise.resolve(patterns)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../file1.js',
          '!../file1.js.map',
          '!../file1.d.ts',
          '!../file1.d.ts.map',
          '!../file2.js',
          '!../file2.js.map',
          '!../file2.d.ts',
          '!../file2.d.ts.map',
          '!../folder1',
          '!../folder2',
          '!../folder1/file3.js',
          '!../folder1/file3.js.map',
          '!../folder1/file3.d.ts',
          '!../folder1/file3.d.ts.map',
          '!../folder2/file4.js',
          '!../folder2/file4.js.map',
          '!../folder2/file4.d.ts',
          '!../folder2/file4.d.ts.map',
          '!../folder2/file5.js',
          '!../folder2/file5.js.map',
          '!../folder2/file5.d.ts',
          '!../folder2/file5.d.ts.map',
        ];
        assert.deepStrictEqual(actual, expected);
      });

      it('does not exclude files with no mapping', async () => {
        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          { fileMapArgument: '.ts:.js', srcRootPath },
          (patterns) => Promise.resolve(patterns)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!../file1.js',
          '!../file2.js',
          '!../folder1',
          '!../folder2',
          '!../folder1/file3.js',
          '!../folder2/file4.js',
        ];
        assert.deepStrictEqual(actual, expected);
      });

      it('applies ignore rule if provided', async () => {
        const srcRootPath = './test/data/**/*';
        const sut = createSUT(
          {
            fileMapArgument: '.ts:.js',
            srcRootPath,
            ignore: '*.tsbuildinfo;*.json',
          },
          (patterns) => Promise.resolve(patterns)
        );
        const actual = await sut.execute();
        const expected: Array<string> = [
          'dest/**/*',
          '!*.tsbuildinfo',
          '!*.json',
          '!../file1.js',
          '!../file2.js',
          '!../folder1',
          '!../folder2',
          '!../folder1/file3.js',
          '!../folder2/file4.js',
        ];
        assert.deepStrictEqual(actual, expected);
      });
    });
  });
});
