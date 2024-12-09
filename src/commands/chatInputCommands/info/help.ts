import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type Client,
} from 'discord.js';

import { ApplyCommandOption, Command } from '#structure/Command';
import { findBestMatch } from '#util/bestmatch';
import { Constants } from '#util/constants';

@ApplyCommandOption(
	new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows information about commands')
		.addStringOption((opt) =>
			opt.setName('command').setDescription('Get help for a specific command').setAutocomplete(true)
		),
	{ allowDM: true, cooldown: 10 }
)
export class UserCommand extends Command {
	public override async autocompleteRun(
		interaction: AutocompleteInteraction,
		options: AutocompleteInteraction['options'],
		client: Client<true>
	) {
		const focused = options.getFocused();
		const commands = client.chatInputCommands
			.filter((c) => !c.ownerOnly)
			.filter((c) => c.name.includes(focused))
			.map((c) => ({
				name: c.name,
				value: c.name,
			}))
			.slice(0, 25);

		await interaction.respond(commands);
	}

	protected override async runTask(
		interaction: ChatInputCommandInteraction<'cached'>,
		options: Command.ChatInputOptions,
		client: Client<true>
	) {
		const commandName = options.getString('command');
		const embed = new EmbedBuilder().setColor('Blurple').setAuthor({
			name: `${client.user.username} Help Menu`,
			iconURL: client.user.displayAvatarURL(),
		});

		if (!commandName) {
			return this.showMainMenu(interaction, client, embed);
		}

		const command = client.chatInputCommands.get(commandName);

		if (!command) {
			const bestMatch = findBestMatch(commandName, Array.from(client.chatInputCommands.keys())).target;

			return interaction.reply({
				content: `❌ Command \`${commandName}\` not found. Did you mean \`${bestMatch}\`?`,
				ephemeral: true,
			});
		}

		embed
			.setTitle(`Command: ${command.name}`)
			.setDescription(command.description)
			.addFields({ name: 'Cooldown', value: `${command.cooldown ?? 3}s`, inline: true });

		if (command.userPermissions?.length) {
			embed.addFields({
				name: 'Required Permissions',
				value: Array.isArray(command.userPermissions)
					? command.userPermissions.join(', ')
					: command.userPermissions.toString(),
			});
		}

		return interaction.reply({ embeds: [embed] });
	}

	private async showMainMenu(
		interaction: ChatInputCommandInteraction<'cached'>,
		client: Client<true>,
		embed: EmbedBuilder
	) {
		const commands = client.chatInputCommands
			.filter((cmd) => !cmd.ownerOnly)
			.map((cmd) => `\`${cmd.name}\` - ${cmd.description}`)
			.sort()
			.join('\n');

		embed.setDescription(
			'Here are all available commands:\n\n' +
				commands +
				'\n\n' +
				'Use `/help <command>` to get detailed information about a specific command.'
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL(Constants.supportInviteLink),
			new ButtonBuilder()
				.setLabel('Invite Bot')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands`)
		);

		return interaction.reply({
			embeds: [embed],
			components: [row],
		});
	}
}
