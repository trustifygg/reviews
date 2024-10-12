import type { ClientEvents } from '#types/events';

const guildDelete: ClientEvents['GuildDelete'] = async (guild) => {
	console.log(`Guild deleted: ${guild.name}`);
};

export default guildDelete;
