// importing logger
import { Buffer } from 'node:buffer';
import { inspect } from 'node:util';

import { envParseString } from '@skyra/env-utilities';
import { AttachmentBuilder, EmbedBuilder, WebhookClient, type Client } from 'discord.js';

import type { Guild, User } from 'discord.js';

import { Logger } from '#lib/logger';
import { Constants } from '#util/constants';
import { trim } from '#util/utils';

export const sendError = (client: Client, error: Error, name: string) => {
	Logger.error(error);
	if (envParseString('NODE_ENV') !== 'production') return;

	const wh = new WebhookClient({
		url: envParseString('ERROR_WEBHOOK_URL'),
	});
	const completeError = inspect(error, { depth: 0 });
	const embed = new EmbedBuilder()
		.setColor(0xff0000)
		.setTitle(name)
		.addFields(
			{
				name: 'Error: ',
				value: `\`${error}\``,
			},
			{
				name: 'Stack: ',
				value: `\`\`\`ps
        ${trim(completeError, 900)}\`\`\`
        `,
			}
		);

	const attachment = new AttachmentBuilder(Buffer.from(`${completeError}`, 'utf8'), {
		name: 'error.log',
	}).setDescription(`${name} error log`);
	void wh.send({
		username: 'Error',
		avatarURL: client.user?.displayAvatarURL(),
		content: `<@&${Constants.errorRole}> ${error}`,
		embeds: [embed],
		files: [attachment],
	});
};

export const otherEvents = (client: Client) => {
	client.on('customError', (error: Error, command: { guild: Guild; name: string; user: User }) => {
		sendError(client, error, `${command.name}, ${command.user}, ${command.guild}`);
	});
	client.on('error', (error) => {
		sendError(client, error, 'error');
	});

	client.rest.on('rateLimited', (data) => {
		Logger.debug(data);
	});
};
