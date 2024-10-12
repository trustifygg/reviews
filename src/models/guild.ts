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

export interface ICustomEmbed {
	color: string;
}

export interface ICustomButton {
	label: string;
	color: string;
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
