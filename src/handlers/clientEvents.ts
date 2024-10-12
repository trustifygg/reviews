// importing required modules
import { readdirSync } from 'node:fs';

import type { Client } from 'discord.js';

import { Logger } from '#lib/logger';

export const handler = (client: Client) => {
	const loadDir = (dir: string) => {
		const eventFiles = readdirSync(`dist/events/${dir}`).filter((file) => file.endsWith('.js'));

		for (const file of eventFiles) {
			try {
				const { default: event } = require(`../events/${dir}/${file}`) as { default: () => void };
				const eventName = file.split('.')[0];
				client.on(eventName, event);
				// remove require cache
				delete require.cache[require.resolve(`../events/${dir}/${file}`)];
			} catch (error) {
				Logger.error(error);
			}
		}
	};

	for (const e of ['client', 'guild']) loadDir(e);
};
