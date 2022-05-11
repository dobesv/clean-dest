#!/usr/bin/env node
//@ts-check
'use-strict';

import yargs from 'yargs';
import { CleanDestination } from './index';

import 'source-map-support/register';

const argv = yargs
  .options({
    'src-root': {
      demand: true,
      describe:
        '[Glob](https://www.npmjs.com/package/globby) pattern(s) for source files.',
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
      describe:
        'An optional starting pattern to delete, default is "dest-root"/**/*.',
      demand: false,
      type: 'string',
    },
    'file-map': {
      default: '.js,.jsx,.ts,.tsx:.js,.js.map,.d.ts,.d.ts.map',
      describe:
        'Describe rule for calculating output files to keep for a given input file',
      demand: false,
      type: 'string',
    },
    permanent: {
      default: false,
      demand: false,
      describe:
        'Optional permanent delete using [del](https://github.com/sindresorhus/del), otherwise uses [trash](https://github.com/sindresorhus/trash).',
      type: 'boolean',
    },
    'dry-run': {
      default: false,
      demand: false,
      describe: 'Optional test run to not actually delete matched files.',
      type: 'boolean',
    },
    verbose: {
      default: false,
      demand: false,
      describe: 'Optional output logging.',
      type: 'boolean',
    },
  })
  .strict()
  .config().argv;

async function main(): Promise<void> {
  /* eslint-disable dot-notation */
  const preprocessor = new CleanDestination({
    srcRootPath: argv['src-root'],
    destRootPath: argv['dest-root'],
    basePattern: argv['base-pattern'],
    fileMapArgument: argv['file-map'],
    permanent: argv['permanent'],
    dryRun: argv['dry-run'],
    verbose: argv['verbose'],
  });
  /* eslint-enable dot-notation */
  await preprocessor.execute();
}

main().catch((error) => console.error(error));
