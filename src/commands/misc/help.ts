import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription("View the list of commands available in Reviews.");

export async function execute(interaction: ChatInputCommandInteraction) {
	const row = new ActionRowBuilder<ButtonBuilder>().setComponents([
		new ButtonBuilder()
			.setLabel("Invite me")
			.setStyle(ButtonStyle.Link)
			.setURL(
				"https://discord.com/api/oauth2/authorize?client_id=982763628551888936&permissions=120259398656&scope=bot+applications.commands"
			),
		new ButtonBuilder()
			.setLabel("Support server")
			.setStyle(ButtonStyle.Link)
			.setURL("https://discord.gg/J9bTk96RRX"),
	]);
	const embed = new EmbedBuilder()
		.setColor("Blurple")
		.setTitle("Reviews' Help Menu")
		.setDescription(
			"Here's a list of Reviews' commands:\n\n`/help`: View this command\n`/review`: Create a review.\n`/reviewme`: Request a review from another user.\n`/edit`: Made a mistake in a review? Edit it with this command.\n`/delete`: Delete a review (DEPRECATED)\n`/config`: Configurate the bot for your server. (admin)\n`/customize`: Customize the bot to your liking. (admin)\n\nEnjoying reviews? Consider joining the [Support Server](https://discord.gg/sGMsZfYDwZ) now. If you have any issues or suggestions, please let us know by joining the server."
		);

	return await interaction.reply({
		embeds: [embed],
		components: [row],
	});
}
