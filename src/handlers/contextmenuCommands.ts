// importing required modules
import { lstatSync, readdirSync } from 'node:fs';

import type { ContextMenuMessageCommand } from '#types/command';
import type { Client } from 'discord.js';

export const handler = (client: Client) => {
	const folders = readdirSync('dist/commands/contextmenuCommands/').filter((file) =>
		lstatSync(`dist/commands/contextmenuCommands/${file}`).isDirectory()
	);
	for (const dir of folders) {
		const commandFiles = readdirSync(`dist/commands/contextmenuCommands/${dir}`).filter((file) => file.endsWith('.js'));
		for (const file of commandFiles) {
			const { command } = require(`../commands/contextmenuCommands/${dir}/${file}`) as {
				command: ContextMenuMessageCommand;
			};
			if (command.name) {
				client.contextmenuCommands.set(command.name, command);
			}

			// delete the require cache
			delete require.cache[require.resolve(`../commands/contextmenuCommands/${dir}/${file}`)];
		}
	}
};
