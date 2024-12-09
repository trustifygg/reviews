import { cyan, cyanBright } from 'colorette';
import { ActivitiesOptions, ActivityType, Client } from 'discord.js';
import figlet from 'figlet';
import gradient from 'gradient-string';

import type { ClientEvents } from '#types/events';

import { Logger } from '#lib/logger';
import { sendStatus } from '#root/status';
import { syncCommands } from '#util/syncCommand';

const readyEvent: ClientEvents['Ready'] = async (client) => {
	// Sync commands first
	await syncCommands(client).catch((error) => {
		Logger.error('Failed to sync commands:', error);
	});

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
	Logger.info('├─ Loaded All Events');

	Logger.info(`├─ Logged in as ${client.user.tag}.`);
	Logger.info(
		`└─ Ready on ${(await client.cluster?.broadcastEval((c: Client) => c.guilds.cache.size))?.reduce((a: any, b: any) => a + b)} servers.`
	);
	void sendStatus(client);

	client.user.setActivity(`/review | Cluster ${client.cluster.id}`, {
		type: ActivityType.Listening as number,
	});

	const statuses = [
		{
			name: `/review | Cluster ${client.cluster.id}`,
			type: ActivityType.Listening,
		},
		{
			name: `${client.guilds.cache.size} Servers`,
			type: ActivityType.Watching,
		},
		{},
		{ name: 'Manage Reviews with Ease', type: ActivityType.Custom },
		{ name: 'reviewsapp.xyz', type: ActivityType.Custom },
	] as ActivitiesOptions[];

	setInterval(() => {
		const index = Math.floor(Math.random() * statuses.length);
		client.user.setPresence({ activities: [statuses[index]] });
	}, 15000);
};

export default readyEvent;
