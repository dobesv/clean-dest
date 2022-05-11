"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert_1 = require("assert");
const index_1 = require("./index");
(0, mocha_1.describe)(index_1.CleanDestination.name, () => {
    const defaultDelUtil = () => Promise.resolve([]);
    const defaultImportUtil = () => Promise.resolve({});
    function createSUT(config, delUtil, importUtil) {
        const defaultConfig = {
            srcRootPath: './src',
            destRootPath: './dest',
            basePattern: null,
            fileMapArgument: null,
            ignore: null,
            permanent: true,
            verbose: true,
            dryRun: true,
        };
        return new index_1.CleanDestination(Object.assign(defaultConfig, config), delUtil || defaultDelUtil, importUtil || defaultImportUtil);
    }
    (0, mocha_1.describe)('constructor', () => {
        (0, mocha_1.it)('exists', () => {
            const sut = createSUT();
            assert_1.strict.ok(sut);
        });
    });
    (0, mocha_1.describe)(index_1.CleanDestination.prototype.execute.name, () => {
        (0, mocha_1.describe)('given typescript file map', () => {
            (0, mocha_1.it)('executes', async () => {
                const tsFileMap = {
                    '.ts': (destFilePath) => [
                        destFilePath.replace(/.ts$/, '.js'),
                        destFilePath.replace(/.ts$/, '.js.map'),
                        destFilePath.replace(/.ts$/, '.d.ts'),
                    ],
                };
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({ fileMapArgument: 'fake', srcRootPath }, (patterns) => Promise.resolve(patterns), () => Promise.resolve(tsFileMap));
                const actual = await sut.execute();
                const expected = [
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
                assert_1.strict.deepStrictEqual(actual, expected);
            });
            (0, mocha_1.it)('only processes files with a mapping', async () => {
                const tsxFileMap = {
                    '.tsx': (destFilePath) => [destFilePath.replace(/.tsx$/, '.js')],
                };
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({ fileMapArgument: 'fake', srcRootPath }, (patterns) => Promise.resolve(patterns), () => Promise.resolve(tsxFileMap));
                const actual = await sut.execute();
                const expected = [
                    'dest/**/*',
                    '!../folder1',
                    '!../folder2',
                    '!../folder2/file5.js',
                ];
                assert_1.strict.deepStrictEqual(actual, expected);
            });
        });
        (0, mocha_1.describe)('given typescript file-map with just string export', () => {
            (0, mocha_1.it)('executes', async () => {
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({ fileMapArgument: 'fake', srcRootPath }, (patterns) => Promise.resolve(patterns), () => Promise.resolve('.ts'));
                const actual = await sut.execute();
                const expected = [
                    'dest/**/*',
                    '!../file1.ts',
                    '!../file2.ts',
                    '!../folder1',
                    '!../folder2',
                    '!../folder1/file3.ts',
                    '!../folder2/file4.ts',
                ];
                assert_1.strict.deepStrictEqual(actual, expected);
            });
            (0, mocha_1.it)('does not exclude files with no mapping', async () => {
                const tsxFileMap = {
                    '.tsx': (destFilePath) => [destFilePath.replace(/.tsx$/, '.js')],
                };
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({ fileMapArgument: 'fake', srcRootPath }, (patterns) => Promise.resolve(patterns), () => Promise.resolve(tsxFileMap));
                const actual = await sut.execute();
                const expected = [
                    'dest/**/*',
                    '!../folder1',
                    '!../folder2',
                    '!../folder2/file5.js',
                ];
                assert_1.strict.deepStrictEqual(actual, expected);
            });
        });
        (0, mocha_1.describe)('given typescript ext map', () => {
            (0, mocha_1.it)('executes', async () => {
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({
                    fileMapArgument: '.js,.ts,.tsx:.js,.js.map,.d.ts,.d.ts.map',
                    srcRootPath,
                }, (patterns) => Promise.resolve(patterns));
                const actual = await sut.execute();
                const expected = [
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
                assert_1.strict.deepStrictEqual(actual, expected);
            });
            (0, mocha_1.it)('does not exclude files with no mapping', async () => {
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({ fileMapArgument: '.ts:.js', srcRootPath }, (patterns) => Promise.resolve(patterns));
                const actual = await sut.execute();
                const expected = [
                    'dest/**/*',
                    '!../file1.js',
                    '!../file2.js',
                    '!../folder1',
                    '!../folder2',
                    '!../folder1/file3.js',
                    '!../folder2/file4.js',
                ];
                assert_1.strict.deepStrictEqual(actual, expected);
            });
            (0, mocha_1.it)('applies ignore rule if provided', async () => {
                const srcRootPath = './test/data/**/*';
                const sut = createSUT({
                    fileMapArgument: '.ts:.js',
                    srcRootPath,
                    ignore: '*.tsbuildinfo;*.json',
                }, (patterns) => Promise.resolve(patterns));
                const actual = await sut.execute();
                const expected = [
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
                assert_1.strict.deepStrictEqual(actual, expected);
            });
        });
    });
});
//# sourceMappingURL=index.spec.js.map