import { ApplicationCommandType, InteractionType } from 'discord.js';

import type { GuildEvents } from '#types/events';

import { exitButtonHandler } from '#util/buttons';
import { verifyCommand } from '#util/verifyCommand';

const interactionCreateEvent: GuildEvents['InteractionCreate'] = async (interaction) => {
	if (!interaction.client.isReady() || interaction.client.uptime < 5_000) return;
	if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
		const command = interaction.client.chatInputCommands.get(interaction.commandName);
		if (!command) return;

		await command.autocompleteRun(interaction, interaction.options, interaction.client);
	} else if (interaction.isChatInputCommand()) {
		const command = interaction.client.chatInputCommands.get(interaction.commandName);
		if (!(await verifyCommand(interaction, command, interaction.client)) || !command) {
			return;
		}

		try {
			await command.interactionRun(interaction, interaction.options, interaction.client);
		} catch (error) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction
					.reply({
						content: 'Sorry, but something seems to have gone wrong. Please try again.',
						ephemeral: true,
					})
					.catch(() => null);
			}

			interaction.client.emit('customError', error, {
				name: interaction.commandName,
				user: interaction.user,
				guild: interaction.guild,
			});
		}
	} else if (interaction.isContextMenuCommand()) {
		const command = interaction.client.contextmenuCommands.get(interaction.commandName);
		if (!(await verifyCommand(interaction, command, interaction.client)) || !command) {
			return;
		}

		try {
			if (
				command.type === ApplicationCommandType.Message &&
				interaction.isMessageContextMenuCommand() &&
				interaction.inCachedGuild()
			) {
				await command.runTask(interaction, interaction.options, interaction.client);
			}

			if (
				command.type === ApplicationCommandType.User &&
				interaction.isUserContextMenuCommand() &&
				interaction.inCachedGuild()
			) {
				await command.runTask(interaction, interaction.options, interaction.client);
			}
		} catch (error) {
			if (!interaction.replied && !interaction.deferred) {
				await interaction
					.reply({
						content: 'I apologize, something went wrong.',
						ephemeral: true,
					})
					.catch(() => null);
			}

			interaction.client.emit('customError', error, {
				name: interaction.commandName,
				user: interaction.user,
				guild: interaction.guild,
			});
		}
	}

	if (interaction.type === InteractionType.MessageComponent) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isButton()) {
			await exitButtonHandler(interaction);
		}
	}
};

export default interactionCreateEvent;
