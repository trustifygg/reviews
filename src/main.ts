import { readdirSync } from 'node:fs';

import { Client, GatewayIntentBits, Options, Partials } from 'discord.js';
import { Agent } from 'undici';

import { config } from './config.js';
import { otherEvents } from './otherEvents.js';

import '#lib/database/mongodb';

import { ClusterClient, getInfo } from 'discord-hybrid-sharding';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message, Partials.Reaction, Partials.Channel],
	failIfNotExists: false,
	sweepers: {
		messages: {
			// check every 5 minutes
			interval: 60,
			// delete messages older than 30 minutes
			// eslint-disable-next-line unicorn/consistent-function-scoping
			filter: () => (msg: { editedTimestamp: any; createdTimestamp: any; author: { bot: any }; member: any }) =>
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				Date.now() - (msg.editedTimestamp ?? msg.createdTimestamp) > 30 * 60 * 1_000 || msg.author?.bot || !msg.member,
		},
		threads: {
			// check every 5 minutes
			interval: 60,
			// delete archived threads
			// eslint-disable-next-line unicorn/consistent-function-scoping
			filter: () => (thread: { archived: any }) => thread.archived!,
		},
	},
	makeCache: Options.cacheWithLimits({
		MessageManager: 100,
	}),

	shards: getInfo().SHARD_LIST,
	shardCount: getInfo().TOTAL_SHARDS,
});

client.cluster = new ClusterClient(client);
const agent = new Agent({
	connect: {
		timeout: 30_000,
	},
});

client.rest.setAgent(agent);

const handlers = [];
const files = readdirSync('dist/handlers/').filter((file) => file.endsWith('.js'));
for (const dir of files) {
	const { handler } = require(`./handlers/${dir}`) as { handler: (client: Client) => void };
	handlers.push(handler);
}

for (const handler of [otherEvents, config, ...handlers]) handler(client);

// logging in with discord with discord token
void client.login(process.env.TOKEN);
