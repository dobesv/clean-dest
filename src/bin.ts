#!/usr/bin/env node
//@ts-check
'use-strict';

import yargs from 'yargs';
import { CleanDestination } from './index';

const argv = yargs
	.options({
	})
	.strict()
	.config()
	.argv;

async function main(): Promise<void> {

	/* eslint-disable dot-notation */
	const preprocessor = new CleanDestination({
	});
	/* eslint-enable dot-notation */
	await preprocessor.execute();
}

main()
	.catch((error) => console.error(error));
