import { ButtonInteraction, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from 'discord.js';
import { IReview, reviewModel } from '#model/review';
import { Logger } from '#lib/logger';
import { guildModel, IGuild } from '#model/guild';

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

export async function createReview(reviewData: Partial<IReview>): Promise<IReview> {
	try {
		const newReview = await reviewModel.create({
			guildId: reviewData.guildId,
			reviewId: reviewData.reviewId,
			messageId: reviewData.messageId,
			authorId: reviewData.authorId,
			title: reviewData.title,
			review: reviewData.review,
			rating: reviewData.rating,
			anonymous: reviewData.anonymous || false,
			attachment: reviewData.attachment,
		});

		return newReview;
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
): EmbedBuilder {
	const ratingStr = settings.ratingEmoji.repeat(review.rating || 0);
	const anonymousAvatarUrl =
		'https://cdn.discordapp.com/attachments/1187454852985524365/1187837153691041914/anonymous.png';

	const embed = new EmbedBuilder()
		.setColor(settings.customEmbed.color as ColorResolvable)
		.setAuthor({
			name: isAnonymous ? 'Anonymous Review' : `Review by ${interaction.user.username}`,
			iconURL: isAnonymous ? anonymousAvatarUrl : interaction.user.displayAvatarURL(),
		})
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

	return embed;
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

		if (!guildSettings?.channel) {
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

		const anonymous = isAnonymous(review.anonymous, guildSettings);
		const reviewEmbed = createReviewEmbed(interaction, review, anonymous, guildSettings);

		const message = await channel.send({
			embeds: [reviewEmbed],
			...(review.attachment ? { files: [review.attachment] } : {}),
		});

		await createReview({
			...review,
			messageId: message.id,
			guildId: interaction.guildId,
			authorId: interaction.user.id,
		});

		if (guildSettings.createThreads) {
			await createReviewThread(message, review, anonymous);
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
