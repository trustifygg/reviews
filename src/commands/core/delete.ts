import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import { getOrCreateGuild } from "../../utils/database";
import { ReviewDB } from "../../models.db";
import { botClient } from "../..";

export const data = new SlashCommandBuilder()
	.setName("delete")
	.setDescription("Delete a review.")
	.addStringOption((option) =>
		option
			.setName("id")
			.setDescription("The id of the review to delete.")
			.setRequired(true)
	);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const guildData = await getOrCreateGuild(interaction.guild!.id);
	const reviewId = interaction.options.getString("id", true);

	const reviewChannelId = guildData.channel;

	if (!reviewChannelId) {
		await interaction.reply("No review channel set up.");
		return;
	}

	const reviewChannel = interaction.guild!.channels.cache.get(reviewChannelId);

	if (!reviewChannel) {
		await interaction.reply("Review channel not found.");
		return;
	}

	const reviewData = await ReviewDB.findOne({
		guildId: interaction.guild!.id,
		reviewId,
	});

	if (!reviewData) {
		await interaction.reply("Review not found.");
		return;
	}

	if (
		reviewData.authorId === interaction.user.id ||
		interaction.guild?.members.cache
			.get(interaction.user.id)
			?.permissions.has("Administrator")
	) {
		const reviewMessage = await (reviewChannel as TextChannel).messages.fetch(
			reviewData.messageId
		);

		await reviewData.deleteOne();
		await reviewMessage.delete();

		if (guildData.logsChannel) {
			const logsChannel: TextChannel = interaction.guild!.channels.cache.get(
				guildData.logsChannel
			) as TextChannel;

			const user = await botClient.users.fetch(reviewData.authorId);

			let stars: string = "";

			for (let i: number = 0; i < reviewData.rating; i++) {
				stars += guildData.ratingEmoji;
			}

			const logEmbed: EmbedBuilder = new EmbedBuilder()
				.setColor("Blurple")
				.setTitle(`Review Delete Log`)
				.addFields(
					{
						name: "Review Title",
						value: `${reviewData.title}`,
						inline: false,
					},
					{
						name: "Review Content",
						value: `${reviewData.review}`,
						inline: false,
					},
					{
						name: "Rating",
						value: `${stars}`,
						inline: false,
					},
					{
						name: "Author",
						value: `\`\`\`${user.username} (${user.id})\`\`\``,
						inline: false,
					}
				);

			await logsChannel.send({
				embeds: [logEmbed],
			});
		}

		return interaction.reply({
			content: `Successfully deleted the review with the ID \`${reviewId}\`.`,
			ephemeral: true,
		});
	} else {
		return interaction.reply({
			content: "You don't have permission to delete this review.",
			ephemeral: true,
		});
	}
};
