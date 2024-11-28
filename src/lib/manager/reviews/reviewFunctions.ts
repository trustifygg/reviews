import { ButtonInteraction, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from 'discord.js';
import jwt from 'jsonwebtoken';
import type { IReview } from '#model/review';
import { Logger } from '#lib/logger';

// Define environment variables
const API_URL = process.env.API_URL || 'http://localhost:5000';
const SALT = process.env.SALT;

if (!SALT) {
	throw new Error('SALT environment variable is not set');
}

// Generate bot token with proper payload
const generateBotToken = () => {
	if (!SALT) {
		throw new Error('SALT environment variable is not set');
	}
	
	return jwt.sign(
		{
			type: 'bot',
			id: 'discord-bot',
			exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
		},
		SALT
	);
};

interface GuildSettings {
	channel: string;
	anonymousReviews: boolean;
	forceAnonymousReviews: boolean;
	createThreads: boolean;
	customEmbed: {
		color: string;
	};
	ratingEmoji: string;
}

const DEFAULT_SETTINGS: GuildSettings = {
	channel: '',
	anonymousReviews: true,
	forceAnonymousReviews: false,
	createThreads: true,
	customEmbed: {
		color: '#5865F2',
	},
	ratingEmoji: '⭐',
};

export async function fetchGuildSettings(guildId: string): Promise<GuildSettings> {
	try {
		Logger.info(`Fetching settings from: ${API_URL}/v1/guilds/${guildId}`);

		const token = generateBotToken();
		const response = await fetch(`${API_URL}/v1/guilds/${guildId}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'Express-Token': `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			Logger.error(['API Error Response:', errorText]);
			return DEFAULT_SETTINGS;
		}

		const data = await response.json();
		return {
			channel: data.channel || '',
			anonymousReviews: data.anonymousReviews ?? true,
			forceAnonymousReviews: data.forceAnonymousReviews ?? false,
			createThreads: data.createThreads ?? true,
			customEmbed: {
				color: data.customEmbed?.color || '#5865F2',
			},
			ratingEmoji: data.ratingEmoji || '⭐',
		};
	} catch (error) {
		Logger.error(['Error in fetchGuildSettings:', error instanceof Error ? error.message : 'Unknown error']);
		return DEFAULT_SETTINGS;
	}
}

export async function createReview(reviewData: Partial<IReview>): Promise<IReview> {
	try {
		const token = generateBotToken();
		const response = await fetch(`${API_URL}/v1/reviews/guild/${reviewData.guildId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Express-Token': `Bearer ${token}`,
			},
			body: JSON.stringify({ review: reviewData }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			Logger.error(['Error creating review in API:', errorText]);
			throw new Error('Failed to create review in database');
		}

		return await response.json();
	} catch (error) {
		Logger.error(['Error in createReview:', error instanceof Error ? error.message : 'Unknown error']);
		throw error;
	}
}

export function determineAnonymity(requestedAnonymous: boolean | undefined, settings: GuildSettings): boolean {
	if (settings.forceAnonymousReviews) return true;
	if (!settings.anonymousReviews) return false;
	return requestedAnonymous ?? false;
}

export function createReviewEmbed(
	interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
	review: Partial<IReview>,
	isAnonymous: boolean,
	settings: GuildSettings
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
		.setTitle(review.title || 'Untitled Review')
		.setDescription(review.review || 'No review content provided')
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
			autoArchiveDuration: 1440, // 24 hours
		});

		await thread.send({
			content: `Discussion thread for this review. Please keep the conversation respectful and constructive.`,
		});
	} catch (error: any) {
		Logger.error('Error creating review thread:', error instanceof Error ? error.message : 'Unknown error');
		// Don't throw - thread creation is not critical
	}
}

export async function postReview(
	interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>,
	review: Partial<IReview>
): Promise<{ success: boolean; message?: any; error?: string }> {
	try {
		// Fetch guild settings
		const guildSettings = await fetchGuildSettings(interaction.guildId);

		// Validate channel configuration
		if (!guildSettings.channel) {
			return {
				success: false,
				error:
					'No review channel has been configured for this server. Please ask an administrator to set up the review channel.',
			};
		}

		// Fetch and validate channel
		const channel = await interaction.guild.channels.fetch(guildSettings.channel);
		if (!channel?.isTextBased()) {
			return {
				success: false,
				error: 'The configured review channel is invalid. Please contact an administrator.',
			};
		}

		// Create and send the review
		const isAnonymous = determineAnonymity(review.anonymous, guildSettings);
		const reviewEmbed = createReviewEmbed(interaction, review, isAnonymous, guildSettings);

		const message = await channel.send({
			embeds: [reviewEmbed],
			...(review.attachment ? { files: [review.attachment] } : {}),
		});

		// Create thread if enabled
		if (guildSettings.createThreads) {
			await createReviewThread(message, review, isAnonymous);
		}

		return { success: true, message };
	} catch (error) {
		Logger.error('Error in postReview:', error instanceof Error ? error.message : 'Unknown error');
		return {
			success: false,
			error: 'There was an error posting your review. Please try again later.',
		};
	}
}
