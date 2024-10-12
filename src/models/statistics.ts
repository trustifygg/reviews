import { model, Schema } from 'mongoose';

const statisticsSchema = new Schema({
	guildId: {
		type: String,
		required: true,
	},
	year: {
		type: Number,
		required: true,
	},
	month: {
		type: Number,
		required: true,
	},
	membersAmount: {
		type: Number,
		default: 0,
	},
});

statisticsSchema.index({ year: 1, month: 1, guildId: 1 }, { unique: true });

export const statisticsModel = model('statistics', statisticsSchema);
