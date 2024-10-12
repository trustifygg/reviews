import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	OAuth2Scopes,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
	type MessageActionRowComponentBuilder,
} from 'discord.js';

import { ApplyCommandOption, Command } from '#structure/Command';
import { Constants } from '#util/constants';
import { authorOrUser } from '#util/utils';

@ApplyCommandOption(new SlashCommandBuilder().setName('invite').setDescription('Invite our bot to your server'), {
	allowDM: true,
	usage: '`{p}invite`',
})
export class UserCommand extends Command {
	protected override runTask(interaction: ChatInputCommandInteraction<'cached'>) {
		if (!interaction.client.isReady()) return;
		const botInviteLink = `${interaction.client.generateInvite({
			scopes: [OAuth2Scopes.ApplicationsCommands, OAuth2Scopes.Bot],
			permissions: [BigInt(1_543_892_063)],
		})}&redirect_uri=${encodeURIComponent('https://discord.gg/w5b7dYRMZH')}&response_type=code`;

		const embed = new EmbedBuilder()
			.setColor(Constants.primaryColor)
			.setTitle(`${interaction.client.user.username}`)
			.setDescription(
				'To gain access to all of the commands on your own server, simply add our bot with just a few clicks.'
			)
			.setFooter({
				text: authorOrUser(interaction).tag,
				iconURL: authorOrUser(interaction).displayAvatarURL(),
			})
			.setTimestamp()
			.addFields(
				{
					name: 'Invite me',
					value: `[Click here](${botInviteLink})`,
				},
				{
					name: 'Support server',
					value: `[Click here](${Constants.supportInviteLink})`,
				}
			);

		const vote = new ButtonBuilder()
			.setLabel('Vote For Me')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://top.gg/bot/${interaction.client.user.id}/vote`);
		const invite = new ButtonBuilder().setLabel('Invite Me').setStyle(ButtonStyle.Link).setURL(botInviteLink);
		const server = new ButtonBuilder()
			.setLabel('Support Server')
			.setStyle(ButtonStyle.Link)
			.setURL(Constants.supportInviteLink);
		const buttonsRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(vote, invite, server);
		return interaction.reply({
			embeds: [embed],
			components: [buttonsRow],
			allowedMentions: {
				repliedUser: false,
			},
		});
	}
}
