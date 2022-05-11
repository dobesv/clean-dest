#!/usr/bin/env node
"use strict";
//@ts-check
'use-strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const index_1 = require("./index");
require("source-map-support/register");
const argv = yargs_1.default
    .options({
    'src-root': {
        demand: true,
        describe: '[Glob](https://www.npmjs.com/package/globby) pattern(s) for source files.',
        alias: 's',
        type: 'string',
    },
    'dest-root': {
        demand: true,
        describe: 'Destination root directory.',
        alias: 'd',
        type: 'string',
    },
    'base-pattern': {
        default: null,
        describe: 'An optional starting pattern to delete, default is "dest-root"/**/*.',
        demand: false,
        type: 'string',
    },
    'file-map': {
        default: '.js,.jsx,.ts,.tsx:.js,.js.map,.d.ts,.d.ts.map',
        describe: 'Describe rule for calculating output files to keep for a given input file',
        demand: false,
        type: 'string',
    },
    ignore: {
        default: '**/*.tsbuildinfo',
        describe: 'Glob of output files to keep regardless of input files (seperate multiple rules with semicolon)',
        demand: false,
        type: 'string',
        alias: 'i',
    },
    permanent: {
        default: false,
        demand: false,
        describe: 'Optional permanent delete using [del](https://github.com/sindresorhus/del), otherwise uses [trash](https://github.com/sindresorhus/trash).',
        type: 'boolean',
        alias: 'p',
    },
    'dry-run': {
        default: false,
        demand: false,
        describe: 'Optional test run to not actually delete matched files.',
        type: 'boolean',
        alias: 'n',
    },
    verbose: {
        default: false,
        demand: false,
        describe: 'Optional output logging.',
        type: 'boolean',
        alias: 'v',
    },
})
    .strict()
    .config().argv;
async function main() {
    /* eslint-disable dot-notation */
    const preprocessor = new index_1.CleanDestination({
        srcRootPath: argv['src-root'],
        destRootPath: argv['dest-root'],
        basePattern: argv['base-pattern'],
        ignore: argv['ignore'],
        fileMapArgument: argv['file-map'],
        permanent: argv['permanent'],
        dryRun: argv['dry-run'],
        verbose: argv['verbose'],
    });
    /* eslint-enable dot-notation */
    await preprocessor.execute();
}
main().catch((error) => console.error(error));
//# sourceMappingURL=bin.js.map