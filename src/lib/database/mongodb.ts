import { envParseString, setup } from '@skyra/env-utilities';
import { connect } from 'mongoose';

import { Logger } from '#lib/logger';

setup();

connect(envParseString('MONGODB_SRV'), {
	// autoIndex: false,
	maxPoolSize: 5,
	connectTimeoutMS: 30_000,
	socketTimeoutMS: 30_000 * 3,
	family: 4,
	serverSelectionTimeoutMS: 30_000,
	heartbeatFrequencyMS: 1_500,
})
	.then(() => Logger.info('Connected to the MongoDB database successfully.'))
	.catch((error) => Logger.error(error));
