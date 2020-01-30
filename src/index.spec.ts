import { describe, it } from 'mocha';
import { strict as assert} from 'assert';

import { CleanDestination, CleanDestinationConfig } from './index';

describe(CleanDestination.name, () => {

	describe(CleanDestination.prototype.execute.name, () => {

		it('test', () => {

			const config: CleanDestinationConfig = {
				srcRootPath: '',
				destRootPath: '',
				fileMapPath: null,
				verbose: true,
				dryRun: true
			};
			const sut = new CleanDestination(config);
			assert.ok(sut);
		});
	});
});
