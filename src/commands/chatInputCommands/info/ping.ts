
import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import { ApplyCommandOption, Command } from '#structure/Command';

@ApplyCommandOption(new SlashCommandBuilder().setName('ping').setDescription('Shows the current latency of bot'))
export class UserCommand extends Command {
	protected override async runTask(interaction: ChatInputCommandInteraction<'cached'>) {
		let sent = await interaction.reply({
			content: `🏓 Pong!`,
			fetchReply: true,
		});
		try {
			sent.edit(
				`🏓 Pong! \`|\` Heartbeat : **${
					interaction.client.ws.ping
				}ms** \`|\` Roundtrip latency : **${
					sent.createdTimestamp - interaction.createdTimestamp
				}ms**.`
			);
		} catch (e) {}
	}
}
