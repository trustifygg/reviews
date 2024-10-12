import { cyan, cyanBright } from 'colorette';
import { ActivityType, Client } from 'discord.js';
import figlet from 'figlet';
import gradient from 'gradient-string';

import type { ClientEvents } from '#types/events';

import { Logger } from '#lib/logger';
import { sendStatus } from '#root/status';

const readyEvent: ClientEvents['Ready'] = async (client) => {
	// Offset Pad
	const pad = ' '.repeat(2);

	// eslint-disable-next-line no-console
	console.log(
		// eslint-disable-next-line n/no-sync
		`${gradient.pastel.multiline(figlet.textSync('R . E . V . I . E . W . S'))}
    ${pad}${cyan('V ') + cyanBright((require('../../../package.json') as { version: string }).version)}`
	);

	Logger.info(`├─ Loaded ${client.chatInputCommands.size} ChatInput Commands`);
	Logger.info(`├─ Loaded ${client.contextmenuCommands.size} ContextMenu Commands`);
	Logger.info(`├─ Loaded ${client.helpCommands.size} Helper Commands`);
	Logger.info('├─ Loaded All Events');
	Logger.info('├─ Loaded all giveaway events');

	Logger.info(`├─ Logged in as ${client.user.tag}.`);
	Logger.info(
		`└─ Ready on ${(await client.cluster?.broadcastEval((c: Client) => c.guilds.cache.size))?.reduce((a: any, b: any) => a + b)} servers.`
	);
	void sendStatus(client);

	client.user.setActivity(`/help or r!help | Cluster ${client.cluster.id}`, {
		type: ActivityType.Listening as number,
	});
};

export default readyEvent;