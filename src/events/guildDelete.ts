import { Events, Guild } from "discord.js";
import { log } from "..";

export const data = {
	name: Events.GuildDelete,
};

export async function execute(guild: Guild): Promise<void> {
	log.silly(`Guild left: ${guild.name}`);
}
