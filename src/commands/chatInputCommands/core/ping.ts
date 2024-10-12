import { performance } from 'node:perf_hooks';

import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction, type Message } from 'discord.js';
import mongoose from 'mongoose';

import { ApplyCommandOption, Command } from '#structure/Command';
import { Constants } from '#util/constants';
import { authorOrUser, formatMs } from '#util/utils';

@ApplyCommandOption(new SlashCommandBuilder().setName('ping').setDescription('Shows the current latency of bot'), {
	usage: '`{p}ping`',
	allowDM: true,
})
export class UserCommand extends Command {
	protected override async runTask(messageOrInteraction: ChatInputCommandInteraction<'cached'> | Message<true>) {
		const embed = new EmbedBuilder()
			.setColor(Constants.primaryColor)
			.setAuthor({
				name: messageOrInteraction.client.user.tag,
				iconURL: messageOrInteraction.client.user.displayAvatarURL(),
			})
			.setDescription(`Pinging${Constants.emojis.colon}  ${Constants.emojis.loading}`)
			.setTimestamp()
			.setFooter({
				text: authorOrUser(messageOrInteraction).tag,
				iconURL: authorOrUser(messageOrInteraction).displayAvatarURL(),
			});
		const message = await messageOrInteraction.reply({
			embeds: [embed],
			fetchReply: true,
		});
		const ping = message.createdTimestamp - messageOrInteraction.createdTimestamp;
		const start = performance.now();
		await mongoose.connection.db.command({ ping: 1 });
		const end = performance.now();
		embed.setDescription(
			`\n**Websocket heartbeat**${Constants.emojis.colon} ${formatMs(messageOrInteraction.client.ws.ping)}` +
				`\n**Roundtrip latency**${Constants.emojis.colon} ${formatMs(ping)}` +
				`\n**DB latency**${Constants.emojis.colon} ${formatMs(end - start)}`
		);
		message.edit({ embeds: [embed] }).catch(() => null);
	}
}
