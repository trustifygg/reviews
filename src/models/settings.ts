import { model, Schema, type InferSchemaType } from 'mongoose';

const settingSchema = new Schema({
	guildId: { type: String, require: true, unique: true },
	prefixes: { type: [String], default: ['r!'] },
	mutedRoleId: { type: String },
	modrole: String,
});

export const settingsModel = model('setting', settingSchema);

export type ISettings = InferSchemaType<typeof settingSchema>;
