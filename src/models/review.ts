import { model, Schema, type InferSchemaType } from 'mongoose';

const reviewSchema = new Schema({
	userId: { type: String },
	guildId: { type: String },
	reviewId: { type: String, unique: true },
	messageId: { type: String, unique: true },
	authorId: { type: String, required: true },
	threadId: { type: String, required: false },
	title: { type: String },
	review: { type: String },
	rating: { type: Number },
	useful: {
		count: { type: Number, default: 0 },
		voted: { type: [Array], default: [] },
	},
	attachment: { type: String },
});

export const reviewModel = model('ReviewDB', reviewSchema, 'Reviews');

export type IReview = InferSchemaType<typeof reviewSchema>;