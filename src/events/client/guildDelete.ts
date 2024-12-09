import type { ClientEvents } from '#types/events';
import { getDynamicTime } from '#util/getDynamicTime';
import { DateResolvable, WebhookClient, EmbedBuilder } from 'discord.js';

const guildDelete: ClientEvents['GuildDelete'] = async (guild) => {
	console.log(`Guild deleted: ${guild.name}`);

	const detailedTime = (date: DateResolvable) =>
		`${getDynamicTime(date, "LONG_TIME_AND_DATE")}  ${getDynamicTime(
			date,
			"RELATIVE"
		)}`;

	const webhook = new WebhookClient({
		url: "https://discord.com/api/webhooks/1200631483250004078/DHI0tOHmwlG5ADiIjeNLTM4ijBmyKTOZ3woUlLfZkptCA-e8S-qRpm8ifeLOVKBEcntL",
	});

	const owner = guild.client.users.cache.get(guild.ownerId);

	const description = `Name: ${guild.name} (${guild.id})\nOwner: ${
		owner?.username
	} (${owner?.id})\nMembers: ${guild.memberCount}\nTotal Guilds: ${
		guild.client.guilds.cache.size
	}\nCreate: ${detailedTime(
		guild.members.me?.joinedAt || new Date()
	)}\nRemove: ${detailedTime(new Date())}
    `;

	const embeds = [
		new EmbedBuilder()
			.setColor("Red")
			.setDescription(description)
			.setAuthor({
				name: guild.name,
				iconURL:
					guild.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png",
			})
			.setThumbnail(guild.iconURL())
			.setTimestamp(),
	];

	const username = "Guild Delete";
	const avatarURL = guild.client.user.displayAvatarURL();

	// eslint-disable-next-line no-console
	webhook.send({ embeds, username, avatarURL }).catch(console.error);
};

export default guildDelete;
