import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { UserDB } from "../../models.db";

export const data = new SlashCommandBuilder()
	.setName("profile")
	.setDescription("View your or another user's profile")
	.setDMPermission(true)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to view the profile of")
			.setRequired(true)
	);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const user = interaction.options.getUser("user", true);
	const userData = await UserDB.findOne({ userId: user.id });

	const embed = new EmbedBuilder()
		.setColor("#5865F2")
		.setAuthor({
			name: `${user.username}'s Profile`,
			iconURL: user.displayAvatarURL(),
		})
		.setDescription(
			`${user.toString()} has a total of \`0\`  reviews with an average rating of \`4.5\`!`
		);

	await interaction.reply({ embeds: [embed] });
};
