import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { getDynamicTime } from "../../utils/getDynamicTime";
import { ReviewDB } from "../../models.db";
import pkg from "../../../package.json";

export const data = new SlashCommandBuilder()
	.setName("botstats")
	.setDescription("Get the bot stats");

export async function execute(interaction: ChatInputCommandInteraction) {
	const { client } = interaction;
	const serverCount = client.guilds.cache.size;
	const reviews: number = await ReviewDB.countDocuments();
	const libraryVersion = pkg.dependencies["discord.js"];
	const botVersion = pkg.version;
	const ping = client.ws.ping;

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents([
		new ButtonBuilder()
			.setLabel("Invite me")
			.setStyle(ButtonStyle.Link)
			.setURL(
				"https://discord.com/api/oauth2/authorize?client_id=1198639435395375164&permissions=120259398656&scope=bot+applications.commands"
			),
		new ButtonBuilder()
			.setLabel("Support server")
			.setStyle(ButtonStyle.Link)
			.setURL("https://discord.gg/J9bTk96RRX"),
	]);

	const embed = new EmbedBuilder()
		.setColor("Blurple")
		.setAuthor({
			name: client.user.tag,
			iconURL: client.user.displayAvatarURL(),
		})
		.setTitle("Reviews' Stats")
		.setDescription(
			`**Server Count**: \`${serverCount}\`\n` +
				`**Total Reviews**: \`${reviews.toLocaleString()}\`\n` +
				`**Library**: \`Discord.js (v${libraryVersion})\`\n` +
				`**Bot Version**: \`${botVersion}\`\n` +
				`**Ping**: \`${ping}ms\`\n` +
				`**Uptime**: ${getDynamicTime(Date.now() - client.uptime, "RELATIVE")}`
		)
		.setThumbnail(client.user.displayAvatarURL({ size: 256 }));

	return interaction.reply({
		embeds: [embed],
		components: [row],
	});
}
