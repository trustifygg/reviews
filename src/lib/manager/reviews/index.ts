import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ColorResolvable,
	EmbedBuilder,
} from 'discord.js';
import { IReview, reviewModel } from '#model/review';
import { Logger } from '#lib/logger';
import { guildModel, IGuild } from '#model/guild';
import { convertButtonStyle } from '#util/convertButtonStyle';

export async function fetchGuildSettings(guildId: string): Promise<IGuild | null> {
	try {
		const settings = await guildModel.findOne({ guildId });
		if (!settings) return await guildModel.create({ guildId });
		return settings;
	} catch (error: any) {
		Logger.error('Error in fetchGuildSettings:', error.message ?? 'Unknown error');
		return null;
	}
}

export async function createReview(reviewData: Partial<IReview>): Promise<Partial<IReview>> {
	try {
		const newReview = await reviewModel.create({
			guildId: reviewData.guildId,
			reviewId: reviewData.reviewId,
			messageId: reviewData.messageId,
			threadId: reviewData.threadId,
			authorId: reviewData.authorId,
			title: reviewData.title,
			review: reviewData.review,
			rating: reviewData.rating,
			anonymous: reviewData.anonymousReview || false,
			attachment: reviewData.attachment,
			useful: { count: 0, users: [] },
		});

		return newReview.toObject();
	} catch (error: any) {
		Logger.error('Error in createReview:', error.message ?? 'Unknown error');
		throw error;
	}
}

export function isAnonymous(toggle: boolean | undefined, settings: IGuild): boolean {
	if (settings.forceAnonymousReviews) return true;
	if (!settings.anonymousReviews) return false;
	return toggle ?? false;
}

export function createReviewEmbed(
	interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
	review: Partial<IReview>,
	isAnonymous: boolean,
	settings: IGuild
): { embed: EmbedBuilder; row: ActionRowBuilder<ButtonBuilder> } {
	const ratingStr = settings.ratingEmoji.repeat(review.rating || 0);
	const anonymousAvatarUrl =
		'https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png';

	// Create button row
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`useful-${review.reviewId}`)
			.setLabel(`Useful (0)`)
			.setEmoji('👍')
			.setStyle(ButtonStyle.Secondary)
	);

	// Add review button if enabled
	if (settings.reviewButton) {
		row.addComponents(
			new ButtonBuilder()
				.setCustomId('writeReview')
				.setLabel(settings.customReviewButton.label)
				.setStyle(convertButtonStyle(settings.customReviewButton.color))
		);
	}

	const embed = new EmbedBuilder()
		.setColor(settings.customEmbed.color as ColorResolvable)
		.setAuthor({
			name: isAnonymous ? 'Anonymous Review' : `Review by ${interaction.user.username}`,
			iconURL: isAnonymous ? anonymousAvatarUrl : interaction.user.displayAvatarURL(),
		})
		.setThumbnail(isAnonymous ? anonymousAvatarUrl : interaction.user.displayAvatarURL())
		.setTitle(review.title || 'New Review')
		.setDescription(review.review || '')
		.addFields({
			name: 'Rating',
			value: ratingStr || 'Not rated',
			inline: true,
		})
		.setFooter({ text: `Review ID: ${review.reviewId}` })
		.setTimestamp();

	if (review.attachment) {
		embed.setImage(review.attachment);
	}

	return { embed, row };
}

export async function createReviewThread(message: any, review: Partial<IReview>, isAnonymous: boolean): Promise<void> {
	try {
		const threadName = `Review: ${review.title?.slice(0, 50)}${isAnonymous ? ' (Anonymous)' : ''}`;
		const thread = await message.startThread({
			name: threadName,
			autoArchiveDuration: 1440,
		});

		await thread.send({
			content: `Discussion thread for this review. Please keep the conversation respectful and constructive.`,
		});
	} catch (error: any) {
		Logger.error('Error creating review thread:', error.message);
	}
}

export async function postReview(
	interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
	review: Partial<IReview>
): Promise<{ success: boolean; message?: any; error?: string }> {
	try {
		const guildSettings = await fetchGuildSettings(interaction.guildId);

		if (!guildSettings) {
			return {
				success: false,
				error: 'Failed to fetch guild settings. Please try again later.',
			};
		}

		if (!guildSettings.channel) {
			return {
				success: false,
				error:
					'No review channel has been configured for this server. Please ask an administrator to set up the review channel.',
			};
		}

		const channel = await interaction.guild.channels.fetch(guildSettings.channel);
		if (!channel?.isTextBased()) {
			return {
				success: false,
				error: 'The configured review channel is invalid. Please contact an administrator.',
			};
		}

		const anonymous = isAnonymous(review.anonymousReview, guildSettings);
		const { embed, row } = createReviewEmbed(interaction, review, anonymous, guildSettings);

		// Send message with components
		const message = await channel.send({
			embeds: [embed],
			components: guildSettings.reviewButton ? [row] : [],
			...(review.attachment ? { files: [review.attachment] } : {}),
		});

		let threadId: string | undefined;

		// Create thread if enabled
		if (guildSettings.createThreads) {
			const thread = await message.startThread({
				name: `Review: ${review.title?.slice(0, 50)}${anonymous ? ' (Anonymous)' : ''}`,
				autoArchiveDuration: 1440,
			});
			threadId = thread.id;

			await thread.send({
				content: `Discussion thread for this review. Please keep the conversation respectful and constructive.`,
			});
		}

		// Create review in database
		const newReview = await createReview({
			...review,
			guildId: interaction.guildId,
			authorId: interaction.user.id,
			messageId: message.id,
			threadId,
			useful: { count: 0, users: [] },
		});

		// Send to logs channel if configured
		if (guildSettings.logsChannel && typeof guildSettings.logsChannel === 'string') {
			await sendReviewLog(interaction, newReview, message.id, guildSettings);
		}

		return { success: true, message };
	} catch (error: any) {
		Logger.error('Error in postReview:', error.message ?? 'Unknown error');
		return {
			success: false,
			error: 'There was an error posting your review. Please try again later.',
		};
	}
}

async function sendReviewLog(
	interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
	review: Partial<IReview>,
	messageId: string,
	settings: IGuild
) {
	try {
		// Check if logsChannel exists and is a string before fetching
		if (!settings.logsChannel || typeof settings.logsChannel !== 'string') return;

		const logsChannel = await interaction.guild.channels.fetch(settings.logsChannel);
		if (!logsChannel?.isTextBased()) return;

		const logEmbed = new EmbedBuilder()
			.setColor('Blurple')
			.setTitle('Review Create Log')
			.addFields(
				{
					name: 'Review ID',
					value: `\`\`\`${review.reviewId}\`\`\``,
					inline: false,
				},
				{
					name: 'Review Title',
					value: review.title || 'No title',
					inline: false,
				},
				{
					name: 'Review Content',
					value: review.review || 'No content',
					inline: false,
				},
				{
					name: 'Rating',
					value: settings.ratingEmoji.repeat(review.rating || 0),
					inline: true,
				},
				{
					name: 'Author',
					value: `\`\`\`${interaction.user.username} (${interaction.user.id})\`\`\``,
					inline: true,
				},
				{
					name: 'Message ID',
					value: `\`\`\`\n${messageId}\n\`\`\``,
					inline: true,
				}
			);

		if (review.attachment) {
			logEmbed.setImage(review.attachment);
		}

		await logsChannel.send({ embeds: [logEmbed] });
	} catch (error) {
		Logger.error('Error sending review log:', error);
	}
}
