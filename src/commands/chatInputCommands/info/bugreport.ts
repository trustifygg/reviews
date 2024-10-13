import { Time } from '@imranbarbhuiya/duration';
import { envParseString } from '@skyra/env-utilities';
import {
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
	WebhookClient,
	type ChatInputCommandInteraction,
	type ModalActionRowComponentBuilder,
} from 'discord.js';

import { ChatInputCommand } from '#structure/ChatInputCommand';
import { ApplyCommandOption, type Command } from '#structure/Command';
import { Constants } from '#util/constants';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('bugreport')
		.setDescription('Report bugs or glitches to our development team')
		.addAttachmentOption((opt) =>
			opt
				.setName('attachments')
				.setDescription(
					'Please feel free to attach any relevant screenshots or other supporting documents to your report'
				)
		),
	{
		cooldown: 10,
		allowDM: true,
	}
)
export class UserCommand extends ChatInputCommand {
	protected override async runTask(
		interaction: ChatInputCommandInteraction<'cached'>,
		options: Command.ChatInputOptions
	) {
		const attachment = options.getAttachment('attachments');

		const modal = new ModalBuilder()
			.setCustomId(`${interaction.id}-report`)
			.setTitle('Report Bug/Glitch')
			.addComponents(
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('report-message')
						.setRequired()
						.setStyle(TextInputStyle.Paragraph)
						.setMinLength(10)
						.setLabel('Report Message')
						.setPlaceholder('Describe the issue you are experiencing in detail')
				),
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId('command-name')
						.setStyle(TextInputStyle.Short)
						.setLabel('Command Name')
						.setPlaceholder('Provide command name if applicable')
				)
			);

		await interaction.showModal(modal);

		const modalResponse = await interaction
			.awaitModalSubmit({
				time: 15 * Time.Minute,
				filter: (i) => i.customId === `${interaction.id}-report`,
			})
			.catch(() => null);

		if (!modalResponse) return;

		const reportMessage = modalResponse.fields.getTextInputValue('report-message');
		const commandName = modalResponse.fields.getTextInputValue('command-name');

		const embed = new EmbedBuilder()
			.setColor(Constants.primaryColor)
			.setAuthor({
				name: `${interaction.user.tag} - ${interaction.user.id}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setTimestamp();
		if (modalResponse.inCachedGuild())
			embed.setFooter({
				text: `${modalResponse.guild.name} - ${modalResponse.guild.id}`,
				iconURL: modalResponse.guild.iconURL() ?? undefined,
			});
		await modalResponse.reply({
			embeds: [
				embed.setDescription(
					'Your bug report has been successfully submitted. ' +
					'Thank you for taking the time and effort to report this issue to us. Your contribution is greatly appreciated, and we will promptly investigate the matter.'
				),
			],
			ephemeral: true,
		});
		const guildInvite = interaction.guild.invites.cache.first();
		const wh = new WebhookClient({
			url: envParseString('REPORT_WEBHOOK_URL'),
		});
		return wh.send({
			username: 'Report',
			avatarURL: interaction.client.user.displayAvatarURL(),
			content: `<@&${Constants.bugRole}>`,
			embeds: [
				embed.setDescription(reportMessage).addFields(
					{
						name: 'Channel Link',
						value: `[Here](${interaction.channel?.url})`,
					},
					{
						name: 'Invite',
						value: `${guildInvite ?? '`Not found`'}`,
					},
					{
						name: 'Command',
						value: `${commandName || '`Not Provided`'}`,
					}
				),
			],
			files: attachment ? [attachment] : [],
		});
	}
}
