import {
	DateResolvable,
	EmbedBuilder,
	Events,
	Guild,
	WebhookClient,
} from "discord.js";
import { log } from "..";
import { getDynamicTime } from "../utils/getDynamicTime";

export const data = {
	name: Events.GuildDelete,
};

export async function execute(guild: Guild): Promise<void> {
	const { client } = guild;
	log.silly(`Guild left: ${guild.name}`);
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
	)}\nRemove: ${detailedTime(new Date())}
    `;

	const embeds = [
		new EmbedBuilder()
			.setColor("Red")
			.setDescription(description)
			.setAuthor({ name: guild.name })
			.setThumbnail(guild.iconURL())
			.setTimestamp(),
	];

	const username = "Guild Delete";
	const avatarURL = guild.client.user.displayAvatarURL();

	// eslint-disable-next-line no-console
	webhook.send({ embeds, username, avatarURL }).catch(console.error);
}
