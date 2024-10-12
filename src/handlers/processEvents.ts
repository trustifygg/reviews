// importing logger
import process from 'node:process';

import type { Client } from 'discord.js';

import { sendError } from '#root/otherEvents';
import { sendStatus } from '#root/status';

export const handler = (client: Client<true>) => {
	const verifyAndSend = (error: Error, name: string) => {
		sendError(client, error, name);
	};

	process.on('unhandledRejection', (error: Error) => {
		verifyAndSend(error, 'Unhandled Promise Rejection');
	});
	process.on('uncaughtException', (error) => {
		verifyAndSend(error, 'Uncaught Exception');
	});

	process.on('uncaughtExceptionMonitor', (error) => {
		verifyAndSend(error, 'Uncaught Exception Monitor');
	});

	process.on('SIGINT', async () => {
		await sendStatus(client, true);
		process.exit(0);
	});
	process.on('SIGTERM', async () => {
		await sendStatus(client, true);
		process.exit(0);
	});
};
