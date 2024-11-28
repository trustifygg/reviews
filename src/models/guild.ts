import { model, Schema, type InferSchemaType } from 'mongoose';

const guildSchema = new Schema({
	guildId: { type: String, unique: true, required: true },
	name: { type: String },
	iconURL: { type: String },
	channel: { type: String },
	logsChannel: { type: String },
	reviewRole: { type: String },
	anonymousReviews: { type: Boolean, default: true },
	forceAnonymousReviews: { type: Boolean, default: false },
	createThreads: { type: Boolean, default: false },
	reviewButton: { type: Boolean, default: true },
	ratingEmoji: { type: String, default: '⭐' },
	reviewTitle: { type: String, defalt: 'New Review Submitted!' },
	customReviewButton: {
		type: {
			label: String,
			color: String,
		},
		default: {
			label: 'Submit Review',
			color: 'blue',
		},
	},
	customEmbed: {
		type: {
			color: String,
		},
		default: {
			color: '#5865F2',
		},
	},
});

export const guildModel = model('GuildDB', guildSchema, 'Guilds');

export type IGuild = InferSchemaType<typeof guildSchema>;
