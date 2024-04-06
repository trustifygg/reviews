import {
	ChatInputCommandInteraction,
	Client,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Replies with Pong!");

export async function execute(
	interaction: ChatInputCommandInteraction,
	client: Client
) {
	let sent = await interaction.reply({
		content: `🏓 Pong!`,
		fetchReply: true,
	});
	try {
		sent.edit(
			`🏓 Pong! \`|\` Heartbeat : **${
				client.ws.ping
			}ms** \`|\` Roundtrip latency : **${
				sent.createdTimestamp - interaction.createdTimestamp
			}ms**.`
		);
	} catch (e) {}
}
