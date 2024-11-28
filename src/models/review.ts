import { model, Schema } from 'mongoose';

export type IReview = {
	userId: string;
	guildId: string;
	reviewId: string;
	messageId: string;
	authorId: string;
	threadId?: string;
	title: string;
	review: string;
	rating: number;
	useful: IUseful;
	attachment?: string;
	createdAt: Date;
	updatedAt?: Date;
	anonymous: boolean;
};

interface IUseful {
	count: number;
	voted: string[];
}

const reviewSchema = new Schema<IReview>({
	userId: { type: String },
	guildId: { type: String, required: true, index: true },
	reviewId: { type: String, unique: true, required: true },
	messageId: { type: String, unique: true },
	authorId: { type: String, required: true },
	threadId: { type: String, required: false },
	title: { type: String, required: true, trim: true },
	review: { type: String, required: true, trim: true },
	rating: { 
		type: Number,
		required: true,
		min: 1,
		max: 5,
		validate: {
			validator: Number.isInteger,
			message: 'Rating must be an integer between 1 and 5'
		}
	},
	useful: {
		count: { type: Number, default: 0 },
		voted: { type: [String], default: [] },
	},
	attachment: { type: String },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date },
	anonymous: { type: Boolean, default: false }
}, {
	timestamps: true
});

reviewSchema.index({ guildId: 1, createdAt: -1 });
reviewSchema.index({ authorId: 1, createdAt: -1 });

export const reviewModel = model('ReviewDB', reviewSchema, 'Reviews');
