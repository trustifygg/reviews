import { Collection, type Client } from 'discord.js';

export const config = (client: Client) => {
	// custom collections
	client.helpCommands = new Collection();
	client.chatInputCommands = new Collection();
	client.contextmenuCommands = new Collection();
	client.cooldown = new Collection();
};
