#!/usr/bin/env node
//@ts-check
'use-strict';

import yargs from 'yargs';
import { CleanDestination } from './index';

const argv = yargs
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
			describe: 'An optional starting pattern to delete, default is "dest-root"/**/*',
			demand: false,
			type: 'string',
		},
		'file-map': {
			default: null,
			describe: 'Path to a js file whose only export is an extension to clean, or a [ext]: fn object to map source path to destination path(s)',
			demand: false,
			type: 'string',
		},
		'permanent': {
			default: false,
			demand: false,
			describe: 'Optional permanent delete using [del](https://github.com/sindresorhus/del), otherwise uses [trash](https://github.com/sindresorhus/trash).',
			type: 'boolean',
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

async function main(): Promise<void> {

	/* eslint-disable dot-notation */
	const preprocessor = new CleanDestination({
		srcRootPath: argv['src-root'],
		destRootPath: argv['dest-root'],
		basePattern: argv['base-pattern'],
		fileMapPath: argv['file-map'],
		permanent: argv['permanent'],
		dryRun: argv['dry-run'],
		verbose: argv['verbose'],
	});
	/* eslint-enable dot-notation */
	await preprocessor.execute();
}

main()
	.catch((error) => console.error(error));
