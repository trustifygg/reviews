import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
} from 'discord.js';

import { ApplyCommandOption } from '#structure/Command';
import { ChatInputCommand } from '#structure/ChatInputCommand';
import { guildModel } from '#model/guild';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('quicksetup')
		.setDescription('Start a automated setup of the bot that takes just seconds!'),
	{ allowDM: false }
)
export class UserCommand extends ChatInputCommand {
	protected override async runTask(interaction: ChatInputCommandInteraction<'cached'>) {
		const initialEmbed = new EmbedBuilder()
			.setTitle('Quick Setup')
			.setColor('Blurple')
			.setDescription(
				`To get started, click the button below to begin the automatic setup.\n*This usually takes a few minutes*\n\nTo further customize the bot, head over to your server's [dashboard](${process.env.WEBSITE_URL}/dashboard/${interaction.guildId}).`
			)
			.setFooter({ text: 'Thanks for choosing Reviews!' });

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setCustomId('quicksetup').setLabel('Begin Quick Setup').setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setURL(`${process.env.WEBSITE_URL}/dashboard/${interaction.guildId}`)
				.setEmoji('🌐')
				.setLabel('Go to the Dashboard')
				.setStyle(ButtonStyle.Link)
		);

		const res = await interaction.reply({ embeds: [initialEmbed], components: [row], ephemeral: true });

		const collector = res.createMessageComponentCollector({ time: 60000 });

		collector.on('collect', async (i) => {
			if (i.customId !== 'quicksetup') return;

			const guildData = await guildModel.findOne({ guildId: interaction.guildId });
			if (!guildData) return await guildModel.create({ guildId: interaction.guildId });

			if (guildData.channel) return interaction.reply('This server has already been setup.');

			const reviewCategory = await interaction.guild.channels.create({
				name: 'Reviews',
				type: ChannelType.GuildCategory,
			});

			const channel = await interaction.guild.channels.create({
				name: 'reviews',
				type: ChannelType.GuildText,
				parent: reviewCategory.id,
			});

			guildData.channel = channel.id;

			const logsChannel = await interaction.guild.channels.create({
				name: 'reviews-logs',
				type: ChannelType.GuildText,
				parent: reviewCategory.id,
			});

			guildData.logsChannel = logsChannel.id;

			await guildData.save();

			await i.reply({
				content: 'Setup complete! You can now start using the bot by typing `/review`.',
				ephemeral: true,
			});
		});
	}
}
