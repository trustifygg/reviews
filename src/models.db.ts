import { Document, model, Schema } from "mongoose";

export interface IGuild extends Document {
	guildId: string;
	channel: string;
	logsChannel: string;
	reviewRole: string;
	anonymousReviews: boolean;
	forceAnonymousReviews: boolean;
	createThreads: boolean;
	reviewButton: boolean;
	ratingEmoji: string;
	reviewTitle: string;
	customEmbed: ICustomEmbed;
	customReviewButton: ICustomButton;
}

export interface IUser extends Document {
	userId: string;
	reviews: string[];
}

export interface ICustomEmbed {
	color: string;
}

export interface ICustomButton {
	label: string;
	color: string;
}

export interface IReview extends Document {
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
}

interface IUseful {
	count: number;
	voted: string[];
}

export const GuildDB = model<IGuild>(
	"GuildDB",
	new Schema({
		guildId: { type: String, unique: true, required: true },
		channel: { type: String },
		logsChannel: { type: String },
		reviewRole: { type: String },
		anonymousReviews: { type: Boolean, default: true },
		forceAnonymousReviews: { type: Boolean, default: false },
		createThreads: { type: Boolean, default: false },
		reviewButton: { type: Boolean, default: true },
		ratingEmoji: { type: String, default: "⭐" },
		reviewTitle: { type: String, defalt: "New Review Submitted!" },
		customReviewButton: {
			type: {
				label: String,
				color: String,
			},
			default: {
				label: "Submit Review",
				color: "blue",
			},
		},
		customEmbed: {
			type: {
				color: String,
			},
			default: {
				color: "#5865F2",
			},
		},
	}),
	"Guilds"
);

export const UserDB = model(
	"UserDB",
	new Schema({
		userId: { type: String, unique: true },
		reviews: { type: [String], default: [] },
	}),
	"Users"
);

export const ReviewDB = model<IReview>(
	"ReviewsDB",
	new Schema({
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
	}),
	"Reviews"
);
