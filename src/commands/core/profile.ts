import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { ReviewDB, UserDB } from "../../models.db";
import { getAverageRating } from "../../utils/getAverageRating";
import { getRating } from "../../utils/convertToStars";

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
	const reviewData = await ReviewDB.find({ userId: user.id });

	const totalReviews = reviewData.length;
	const averageRating = await getAverageRating(undefined, user.id);
	const latestReview = reviewData[0];

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		new ButtonBuilder()
			.setCustomId("view_reviews")
			.setLabel("View Reviews")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("📃")
	);

	const embed = new EmbedBuilder()
		.setColor("#5865F2")
		.setAuthor({
			name: `${user.username}'s Profile`,
			iconURL: user.displayAvatarURL(),
		})
		.setDescription(
			reviewData
				? `${user.toString()} has a total of \`${totalReviews}\`  reviews with an average rating of \`${averageRating}\`!`
				: `No reviews found for ${user.toString}`
		)
		.addFields({
			name: "Most Recent Review",
			value: `${latestReview.review} - ${getRating(latestReview.rating)} (${
				latestReview.rating
			} / 5)`,
			inline: false,
		});

	const sent = await interaction.reply({ embeds: [embed], components: [row] });

	await sent
		.awaitMessageComponent({
			filter: (i) => i.customId === "view_reviews",
			componentType: ComponentType.Button,
		})
		.then(async (button) => {
			const reviews = reviewData.map((review) => {
				const rating = review.rating;
				const description = review.review;

				return `${getRating(rating)} (${rating} / 5) - ${description}`;
			});

			const reviewEmbed = new EmbedBuilder()
				.setColor("#5865F2")
				.setTitle(`${user.username}'s Reviews`)
				.setDescription(reviews.join("\n"));

			await button.reply({ embeds: [reviewEmbed], ephemeral: true });
		});
};
