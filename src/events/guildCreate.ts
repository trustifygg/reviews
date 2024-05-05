import {
	DateResolvable,
	EmbedBuilder,
	Events,
	Guild,
	WebhookClient,
} from "discord.js";
import { EventOptions } from "../types";
import { GuildDB, IGuild } from "../models.db";
import { log } from "..";
import { getDynamicTime } from "../utils/getDynamicTime";

export const data: EventOptions = {
	name: Events.GuildCreate,
};

export async function execute(guild: Guild): Promise<void> {
	const { client } = guild;
	const data: IGuild = (await GuildDB.findOne({ guildId: guild.id })) as IGuild;

	if (!data) {
		const newGuild = new GuildDB({
			guildId: guild.id,
		});

		await newGuild.save();
	}
	log.silly(`Guild joined: ${guild.name}`);

	const detailedTime = (date: DateResolvable) =>
		`${getDynamicTime(date, "LONG_TIME_AND_DATE")}  ${getDynamicTime(
			date,
			"RELATIVE"
		)}`;

	const webhook = new WebhookClient({
		url: "https://discord.com/api/webhooks/1200631483250004078/DHI0tOHmwlG5ADiIjeNLTM4ijBmyKTOZ3woUlLfZkptCA-e8S-qRpm8ifeLOVKBEcntL",
	});

	const owner = await guild.fetchOwner();

	const description = `Name: ${guild.name} (${guild.id})\nOwner: ${
		owner.user.username
	} (${owner.id})\nMembers: ${guild.memberCount}\nTotal Guilds: ${
		client.guilds.cache.size
	}\nCreate: ${detailedTime(
		guild.members.me?.joinedAt || new Date()
	)}\nRemove: ❌
	    `;

	const embeds = [
		new EmbedBuilder()
			.setColor("Green")
			.setDescription(description)
			.setAuthor({ name: guild.name })
			.setThumbnail(guild.iconURL())
			.setTimestamp(),
	];

	const username = "Guild Create";
	const avatarURL = guild.client.user.displayAvatarURL();

	await webhook.send({ embeds, username, avatarURL }).catch(console.error);
}
