import { ApplicationCommandType } from 'discord.js';
import { Pagination } from 'pagination.djs';

import type { ContextMenuMessageCommand } from '#types/command';

import { Constants } from '#util/constants';

export const command: ContextMenuMessageCommand = {
	name: 'grab sticker',
	type: ApplicationCommandType.Message,

	async runTask(interaction) {
		const message = interaction.targetMessage;

		const { stickers } = message;
		if (!stickers.size) return interaction.reply('No stickers found in message.');

		const descriptions = stickers.map((sticker) => `Name: [${sticker.name}](${sticker.url})\nId: ${sticker.id}`);
		const images = stickers.map((sticker) => sticker.url);
		await new Pagination(interaction, {
			...Constants.emojis,
			limit: 1,
		})
			.setTitle('Sticker Grabber')
			.setColor(Constants.primaryColor)
			.setDescriptions(descriptions)
			.setImages(images)
			.render();
	},
};
