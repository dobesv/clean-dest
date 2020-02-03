"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mocha_1 = require("mocha");
const assert_1 = require("assert");
const path_1 = tslib_1.__importDefault(require("path"));
const index_1 = require("./index");
mocha_1.describe(index_1.CleanDestination.name, () => {
    function createSUT(config, delUtil, importUtil) {
        const defaultConfig = {
            //srcRootPath: 'C:\\Users\\seans\\Documents\\GitHub\\SeanSobey\\chartjs-node-canvas\\src',
            srcRootPath: 'C:/Users/seans/Documents/GitHub/SeanSobey/chartjs-node-canvas/src',
            destRootPath: 'C:\\Users\\seans\\Documents\\GitHub\\SeanSobey\\chartjs-node-canvas\\dest',
            basePattern: null,
            fileMapPath: 'C:\\Users\\seans\\Documents\\GitHub\\SeanSobey\\chartjs-node-canvas\\scripts\\clean-dest',
            permanent: true,
            verbose: true,
            dryRun: false
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
        mocha_1.it.only('executes', async () => {
            // const srcRootPath = '/some/path/';
            const sut = createSUT(undefined, undefined, (fileMapPath) => Promise.resolve().then(() => tslib_1.__importStar(require(path_1.default.resolve(fileMapPath)))));
            const actual = await sut.execute();
            const expected = [];
            //assert.deepStrictEqual(actual, expected);
        });
    });
});
//# sourceMappingURL=index.spec.js.map