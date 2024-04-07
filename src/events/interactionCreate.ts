import {
	ChatInputCommandInteraction,
	DateResolvable,
	EmbedBuilder,
	Events,
	WebhookClient,
} from "discord.js";
import { botClient, commands, log } from "..";
import { EventOptions } from "../types";
import { getDynamicTime } from "../utils/getDynamicTime";

export const data: EventOptions = { name: Events.InteractionCreate };

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	if (!interaction.isCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction, botClient);

		const detailedTime = (date: DateResolvable) =>
			`${getDynamicTime(date, "LONG_TIME_AND_DATE")}  ${getDynamicTime(
				date,
				"RELATIVE"
			)}`;
			
		const webhook = new WebhookClient({
			url: "https://discord.com/api/webhooks/1200806176850464808/siR8_iUsZQ58JG8cGrcJ96f0eXrTHRHcJqL1nWAsw9W8st5COMLGh-TIwFRrXwtwvnco",
		});
		const description = `Name: </${interaction.commandName}:${
			interaction.commandId
		}>\nGuild: ${interaction.guild!.name} (${interaction.guild!.id})\nRan by: ${
			interaction.user.username
		} (${interaction.user.id})\nCreate: ${detailedTime(new Date())}`;

		const embeds = [
			new EmbedBuilder()
				.setColor("Blurple")
				.setDescription(description)
				.setAuthor({ name: interaction.guild!.name })
				.setThumbnail(interaction.guild!.iconURL())
				.setTimestamp(),
		];

		const avatarURL = interaction.client.user.displayAvatarURL();

		// eslint-disable-next-line no-console
		webhook.send({ embeds, avatarURL }).catch(console.error);
	} catch (error) {
		log.error(error);
		await interaction.reply({
			content:
				"There was an error while executing this command! Try again later.",
			ephemeral: true,
		});
	}
}
