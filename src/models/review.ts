import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		index: true,
	},
	reviewId: {
		type: String,
		required: true,
	},
	authorId: {
		type: String,
		required: true,
	},
	messageId: {
		type: String,
	},
	threadId: { type: String, required: false },
	title: {
		type: String,
		required: true,
	},
	review: {
		type: String,
		required: true,
	},
	rating: {
		type: Number,
		required: true,
		min: 1,
		max: 5,
	},
	anonymousReview: {
		type: Boolean,
		default: false,
	},
	attachment: { type: String },
	useful: {
		count: {
			type: Number,
			default: 0,
		},
		users: [
			{
				type: String,
			},
		],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const reviewModel = mongoose.model('ReviewsDB', reviewSchema, 'Reviews');

export interface IReview extends mongoose.Document {
	guildId: string;
	reviewId: string;
	authorId: string;
	messageId?: string;
	threadId?: string
	title: string;
	review: string;
	rating: number;
	anonymousReview: boolean;
	useful: { count: number; users: string[] };
	createdAt: Date;
	attachment: string;
}
