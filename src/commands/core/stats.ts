import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { getTotalReviews } from "../../utils/getTotalReviews";
import { getAverageRating } from "../../utils/getAverageRating";
import { getRating } from "../../utils/convertToStars";

export const data = new SlashCommandBuilder()
	.setName("stats")
	.setDescription("View review statistics for a server.");

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const totalReviews = await getTotalReviews(interaction.guildId!);
	const averageRating = await getAverageRating(interaction.guildId!);

	const embed = new EmbedBuilder()
		.setColor("Blurple")
		.setTitle("Review Statistics")
		.setDescription("Here are the review statistics for this server.")
		.addFields(
			{
				name: "Total Reviews",
				value: `${totalReviews} reviews`,
				inline: true,
			},
			{
				name: "Average Rating",
				value: `${getRating(averageRating)} (${averageRating}) / 5`,
				inline: true,
			}
		);

	return await interaction.reply({
		embeds: [embed],
	});
};
