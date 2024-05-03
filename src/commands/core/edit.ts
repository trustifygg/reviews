import {
	ActionRowBuilder,
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	EmbedData,
	ForumChannel,
	Message,
	ModalBuilder,
	NewsChannel,
	SlashCommandBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { IGuild, ReviewDB } from "../../models.db";
import { getOrCreateGuild } from "../../db";
import { getRating } from "../../utils/convertToStars";

export const data = new SlashCommandBuilder()
	.setName("edit")
	.setDescription("Edit a review.")
	.setDMPermission(false)
	.addStringOption((option) =>
		option
			.setName("review-id")
			.setDescription("The ID of the review you want to edit.")
			.setRequired(true)
	);
export const execute = async (interaction: ChatInputCommandInteraction) => {
	const data: IGuild = await getOrCreateGuild(interaction.guildId!);
	const reviewId: string = interaction.options.getString("review-id", true);

	const review = await ReviewDB.findOne({
		guildId: interaction.guildId!,
		reviewId,
	});

	if (!data.channel) {
		return interaction.reply({
			content: "There is no review channel set.",
			ephemeral: true,
		});
	}

	const reviewchannel = interaction.guild?.channels.cache.get(data.channel) as
		| TextChannel
		| NewsChannel
		| ForumChannel;

	if (!review) {
		return interaction.reply({
			content: "Review not found.",
			ephemeral: true,
		});
	}

	let reviewMessage: Message | undefined = undefined;

	if (reviewchannel?.type === ChannelType.GuildForum) {
		const thread = await reviewchannel.threads.fetch(review.threadId);
		reviewMessage = (await thread?.messages.fetch())?.first();
	} else {
		reviewMessage = await reviewchannel.messages.fetch(review.messageId);
	}

	if (!reviewMessage) {
		return interaction.reply({
			content: "Review not found.",
			ephemeral: true,
		});
	}

	if (interaction.user.id !== review.authorId) {
		return interaction.reply({
			content: "You can only edit your own reviews.",
			ephemeral: true,
		});
	}

	const reviewModalRow1 =
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setCustomId("reviewTitle")
				.setPlaceholder("Review Title")
				.setLabel("Title")
				.setStyle(TextInputStyle.Short)
				.setMaxLength(256)
				.setRequired(false)
		);

	const reviewModalRow2 =
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setCustomId("reviewContent")
				.setPlaceholder("Review Content")
				.setLabel("Content")
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(2048)
				.setRequired(false)
		);

	const reviewModalRow3 =
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setCustomId("reviewRating")
				.setPlaceholder("Review Rating")
				.setLabel("Rating")
				.setStyle(TextInputStyle.Short)
				.setMaxLength(1)
				.setMinLength(1)
				.setRequired(false)
		);

	const editReviewModal = new ModalBuilder()
		.setTitle("Edit a Review")
		.setCustomId("editReviewModal")
		.addComponents(reviewModalRow1, reviewModalRow2, reviewModalRow3);

	if (data.anonymousReviews === true) {
		const reviewModalRow4 =
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("anonymous")
					.setPlaceholder("Anonymous")
					.setLabel("Anonymous (true/false)")
					.setStyle(TextInputStyle.Short)
					.setRequired(false)
			);
		editReviewModal.addComponents(reviewModalRow4);
	}

	await interaction.showModal(editReviewModal);

	await interaction
		.awaitModalSubmit({
			filter: async (i) =>
				(await i.deferUpdate()) &&
				i.user.id === i.user.id &&
				i.customId === "editReviewModal",
			time: 1000 * 60 * 5,
		})
		.then(async (modal) => {
			const title: string = modal.fields.getTextInputValue("reviewTitle");
			const content: string = modal.fields.getTextInputValue("reviewContent");
			const rating: number = Number(
				modal.fields.getTextInputValue("reviewRating")
			);
			const anonymous: string = data.anonymousReviews
				? modal.fields.getTextInputValue("anonymous")
				: "false";

			if (!title && !content && !rating && !anonymous) {
				await modal.reply({
					content:
						"You didn't provide anything to edit! The review was not edited.",
					ephemeral: true,
				});
				return;
			}

			const reviewEmbed = reviewMessage.embeds[0] as EmbedData;
			const updatedEmbed = new EmbedBuilder(reviewEmbed);

			if (title) {
				review.title = title;
				updatedEmbed.setTitle(title);
			}

			if (content) {
				review.review = content;
				updatedEmbed.setDescription(content);
			}

			if (Number(rating)) {
				review.rating = rating;

				if (isNaN(rating)) {
					await modal.reply({
						content: `The rating must be a number!`,
						ephemeral: true,
					});
					return;
				}

				if (rating > 5) {
					await modal.reply({
						content: `The rating must be 5 or less.`,
						ephemeral: true,
					});
					return;
				}

				if (rating < 1) {
					await modal.reply({
						content: `The rating must be 1 or more.`,
						ephemeral: true,
					});
					return;
				}

				let stars = getRating(Number(rating));

				updatedEmbed.setFields({
					name: "Rating:",
					value: stars,
				});
			}

			if (review.userId) {
				const user = interaction.guild!.members.cache.get(review.userId);
				if (user) {
					updatedEmbed.addFields({
						name: "User Reviewed:",
						value: user.toString(),
					});
				}
			}

			await reviewMessage.edit({
				embeds: [updatedEmbed],
			});

			if (data.logsChannel) {
				const logsChannel: TextChannel = interaction.guild!.channels.cache.get(
					data.logsChannel
				) as TextChannel;

				const logEmbed: EmbedBuilder = new EmbedBuilder()
					.setColor("Blurple")
					.setTitle(`Review Edit Log`)
					.addFields(
						{
							name: `Review ID`,
							value: `\`\`\`${reviewId}\`\`\``,
							inline: false,
						},
						{
							name: "Previous Title",
							value: review.title,
							inline: true,
						},
						{
							name: "New Title",
							value: title,
							inline: false,
						},
						{
							name: "Previous Review",
							value: review.review,
							inline: true,
						},
						{
							name: "New Review",
							value: content,
							inline: true,
						},
						{
							name: "Previous Rating",
							value: getRating(review.rating),
							inline: false,
						},
						{
							name: "New Rating",
							value: getRating(rating),
							inline: true,
						},
						{
							name: "Author",
							value: `\`\`\`${interaction.user.username} (${interaction.user.id})\`\`\``,
							inline: false,
						},
						{
							name: "Message ID",
							value: `\`\`\`\n${review.messageId}\n\`\`\``,
							inline: true,
						}
					);

				await logsChannel.send({
					embeds: [logEmbed],
				});
				await review.save();
			}

			return interaction.followUp({
				content: `Successfully edited the review with the ID \`${reviewId}\``,
				ephemeral: true,
			});
		});
};
