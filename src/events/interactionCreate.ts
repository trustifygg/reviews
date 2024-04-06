import { ChatInputCommandInteraction, Events } from "discord.js";
import { botClient, commands, log } from "..";
import { EventOptions } from "../types";

export const data: EventOptions = { name: Events.InteractionCreate };

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	if (!interaction.isCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, botClient);
	} catch (error) {
		log.error(error);
		await interaction.reply({
			content:
				"There was an error while executing this command! Try again later.",
			ephemeral: true,
		});
	}
}
