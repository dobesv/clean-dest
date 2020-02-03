#!/usr/bin/env node
"use strict";
//@ts-check
'use-strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const index_1 = require("./index");
const argv = yargs_1.default
    .options({
    'src-root': {
        demand: true,
        describe: '[Glob](https://www.npmjs.com/package/globby) pattern(s) for source files',
        alias: 's',
        type: 'string',
    },
    'dest-root': {
        demand: true,
        describe: 'Destination root directory',
        alias: 'd',
        type: 'string',
    },
    'base-pattern': {
        default: null,
        describe: 'An optional starting pattern to delete, default is "src-root"/**/*',
        demand: false,
        type: 'string',
    },
    'file-map': {
        default: null,
        describe: 'Path to a js file whose only export is an extension to clean, or a [ext]: fn object to map source path to destination path(s)',
        demand: false,
        type: 'string',
    },
    'dry-run': {
        default: false,
        demand: false,
        describe: 'Optional test run to not actually delete matched files.',
        type: 'boolean',
    },
    'verbose': {
        default: false,
        demand: false,
        describe: 'Optional output logging.',
        type: 'boolean',
    },
})
    .strict()
    .config()
    .argv;
async function main() {
    /* eslint-disable dot-notation */
    const preprocessor = new index_1.CleanDestination({
        srcRootPath: argv['src-root'],
        destRootPath: argv['dest-root'],
        basePattern: argv['base-pattern'],
        fileMapPath: argv['file-map'],
        dryRun: argv['dry-run'],
        verbose: argv['verbose'],
    });
    /* eslint-enable dot-notation */
    await preprocessor.execute();
}
main()
    .catch((error) => console.error(error));
//# sourceMappingURL=bin.js.map