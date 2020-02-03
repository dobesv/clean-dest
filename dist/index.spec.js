"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert_1 = require("assert");
const index_1 = require("./index");
mocha_1.describe(index_1.CleanDestination.name, () => {
    function createSUT(config, delUtil, importUtil) {
        const defaultConfig = {
            srcRootPath: '',
            destRootPath: '',
            fileMapPath: null,
            verbose: true,
            dryRun: true
        };
        const fileMap = {};
        const defaultDelUtil = () => Promise.resolve([]);
        const defaultImportUtil = () => Promise.resolve(fileMap);
        return new index_1.CleanDestination(Object.assign(defaultConfig, config), delUtil || defaultDelUtil, importUtil || defaultImportUtil);
    }
    mocha_1.describe('constructor', () => {
        mocha_1.it('exists', () => {
            const sut = createSUT();
            assert_1.strict.ok(sut);
        });
    });
    mocha_1.describe(index_1.CleanDestination.prototype.execute.name, () => {
        mocha_1.it('executes', async () => {
            const srcRootPath = '/some/path/';
            const sut = createSUT({ srcRootPath });
            const actual = await sut.execute();
            const expected = [];
            assert_1.strict.deepStrictEqual(actual, expected);
        });
    });
});
//# sourceMappingURL=index.spec.js.map