import mongoose from "mongoose";
import { log } from ".";
import { GuildDB } from "./models.db";

export const initDB = async (): Promise<void> => {
	await mongoose
		.connect(process.env.DATABASE_URL as string)
		.then(() => {
			log.info("Connected to MongoDB");
		})
		.catch((err) => log.error(err));
};

export const getOrCreateGuild = async (guildId: string) => {
	const guild = await GuildDB.findOne({ guildId });
	if (!guild) return await GuildDB.create({ guildId });
	return guild;
};

export const createGuild = async (guildId: string) => {
	return await GuildDB.create({ guildId });
};
