import { Events, Guild } from "discord.js";
import { EventOptions } from "../types";
import { GuildDB, IGuild } from "../database/models";
import { log } from "..";

export const data: EventOptions = {
	name: Events.GuildCreate,
};

export async function execute(guild: Guild): Promise<void> {
	const data: IGuild = (await GuildDB.findOne({ guildId: guild.id })) as IGuild;

	if (!data) {
		const newGuild = new GuildDB({
			guildId: guild.id,
		});

		await newGuild.save();
	}
	log.silly("Guild joined.");
}
