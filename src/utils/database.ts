import { GuildDB } from "../database/models";

export const getOrCreateGuild = async (guildId: string) => {
	const guild = await GuildDB.findOne({ guildId });
	if (!guild) return await GuildDB.create({ guildId });
	return guild;
};

export const createGuild = async (guildId: string) => {
	return await GuildDB.create({ guildId });
};
