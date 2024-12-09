import type { ClientEvents } from '#types/events';

import { guildModel } from '#model/guild';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, DateResolvable, EmbedBuilder, WebhookClient } from 'discord.js';
import { Constants } from '#util/constants';
import { getDynamicTime } from '#util/getDynamicTime';

const guildCreateEvent: ClientEvents['GuildCreate'] = async (guild) => {
	const data = await guildModel.findOne({ guildId: guild.id });
	if (data) return;
	await guildModel.create({
		guildId: guild.id,
		name: guild.name,
		iconURL: guild.iconURL(),
	});

	const joinEmbed = new EmbedBuilder()
		.setAuthor({ name: '👋 Thanks for choosing Reviews!', iconURL: guild.client.user.displayAvatarURL() })
		.setColor('Blurple')
		.setDescription(
			`To get started use the \`/quicksetup\` to begin the automatic setup or visit the [dashboard](${process.env.WEBSITE_URL}/dashboard/${guild.id}) to further customize the me!`
		)
		.addFields({
			name: 'Help',
			value:
				'To view my commands, use the `/help` command. Additionally, if you encounter any issues or need help, feel free to join our [support server](${Constants.supportInviteLink}).',
		});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setURL(`${process.env.WEBSITE_URL}/dashboard/${guild.id}`)
			.setEmoji('🌐')
			.setLabel('Go to the Dashboard')
			.setStyle(ButtonStyle.Link),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setEmoji('🏠')
			.setLabel('Support Server')
			.setURL(Constants.supportInviteLink)
	);

	guild.systemChannel?.send({ embeds: [joinEmbed], components: [row] });

	const detailedTime = (date: DateResolvable) =>
		`${getDynamicTime(date, 'LONG_TIME_AND_DATE')}  ${getDynamicTime(date, 'RELATIVE')}`;

	const webhook = new WebhookClient({
		url: 'https://discord.com/api/webhooks/1200631483250004078/DHI0tOHmwlG5ADiIjeNLTM4ijBmyKTOZ3woUlLfZkptCA-e8S-qRpm8ifeLOVKBEcntL',
	});

	const owner = await guild.fetchOwner();

	const description = `Name: ${guild.name} (${guild.id})\nOwner: ${
		owner.user.username
	} (${owner.id})\nMembers: ${guild.memberCount}\nTotal Guilds: ${
		guild.client.guilds.cache.size
	}\nCreate: ${detailedTime(guild.members.me?.joinedAt || new Date())}\nRemove: ❌
	    `;

	const embeds = [
		new EmbedBuilder()
			.setColor('Green')
			.setDescription(description)
			.setAuthor({ name: guild.name, iconURL: guild.iconURL() || undefined })
			.setThumbnail(guild.iconURL())
			.setTimestamp(),
	];

	const username = 'Guild Create';
	const avatarURL = guild.client.user.displayAvatarURL();

	await webhook.send({ embeds, username, avatarURL }).catch(console.error);
};

export default guildCreateEvent;
