import { envParseString } from '@skyra/env-utilities';
import { EmbedBuilder, WebhookClient, type Client } from 'discord.js';

import { Constants } from '#util/constants';

export const sendStatus = async (client: Client<true>, offline = false) => {
	const wh = new WebhookClient({
		url: envParseString('STATUS_WEBHOOK_URL'),
	});
	if (envParseString('NODE_ENV') !== 'production') return;

	const embed = new EmbedBuilder()
		.setTitle('Bot Status')
		.setColor(offline ? 0xff0000 : 0x00ff00)
		.setDescription(
			`${offline ? Constants.emojis.redDot : Constants.emojis.greenDot} Bot is ${offline ? 'going offline' : 'back online'
			}`
		)
		.setTimestamp();
	if (offline) {
		embed.setFooter({ text: 'Restarting in 10 seconds' });
	}

	await wh.send({
		username: 'Status',
		embeds: [embed],
	});
};
