import type { ClientEvents } from '#types/events';

import { guildModel } from '#model/guild';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Constants } from '#util/constants';

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
};

export default guildCreateEvent;
