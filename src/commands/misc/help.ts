import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription("...");

export async function execute(interaction: ChatInputCommandInteraction) {
	const embed = new EmbedBuilder()
		.setColor("Blurple")
		.setTitle("Reviews' Help Menu")
		.setDescription("Here's a list of Reviews' commands:");

	return await interaction.reply({
		embeds: [embed],
	});
}
