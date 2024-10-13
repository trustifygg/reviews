import { model, Schema } from 'mongoose';

export type IReview = {
	userId: string;
	guildId: string;
	reviewId: string;
	messageId: string;
	authorId: string;
	threadId: string;
	title: string;
	review: string;
	rating: number;
	useful: IUseful;
	attachment: string;
};

interface IUseful {
	count: number;
	voted: string[];
}

const reviewSchema = new Schema<IReview>({
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
