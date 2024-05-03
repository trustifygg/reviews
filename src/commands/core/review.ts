import {
	ChatInputCommandInteraction,
	GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { getOrCreateGuild } from "../../db";
import { sendReview } from "../../utils/sendReview";

export const data = new SlashCommandBuilder()
	.setName("review")
	.setDescription("Create a review")
	.addStringOption((option) =>
		option
			.setName("title")
			.setDescription("The title of the review")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("content")
			.setDescription("The content of the review")
			.setRequired(true)
	)
	.addNumberOption((option) =>
		option
			.setName("rating")
			.setDescription("The rating of the review")
			.setRequired(true)
			.setMinValue(1)
			.setMaxValue(5)
	)
	.addStringOption((option) =>
		option
			.setName("anonymous")
			.setDescription("Whether the review should be anonymous")
			.setRequired(false)
			.setChoices({ name: "Yes", value: "yes" }, { name: "No", value: "no" })
	)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to review")
			.setRequired(false)
	)
	.addAttachmentOption((option) =>
		option
			.setName("image")
			.setDescription("The image to attach to the review")
			.setRequired(false)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const title: string = interaction.options.getString("title", true);
	const content: string = interaction.options.getString("content", true);
	const rating: number = interaction.options.getNumber("rating", true);
	const anonymous: string = interaction.options.getString("anonymous") || "no";
	const user: GuildMember = interaction.options.getMember(
		"user"
	) as GuildMember;
	const image = interaction.options.getAttachment("image")?.url;

	const data = await getOrCreateGuild(interaction.guildId!);

	if (
		data.reviewRole &&
		!interaction
			.guild!.members.cache.get(interaction.user.id)
			?.roles.cache.has(data.reviewRole)
	) {
		await interaction.reply({
			content: "You do not have permission to create a review.",
			ephemeral: true,
		});
		return;
	}

	if (user && user.id === interaction.user.id) {
		await interaction.reply({
			content: "You cannot review yourself.",
			ephemeral: true,
		});
		return;
	}

	await sendReview(
		interaction,
		title,
		content,
		rating,
		anonymous === "yes" ? true : false,
		user,
		image
	);

	await interaction.reply({
		content: `Successfully created your review.`,
		ephemeral: true,
	});
	return;
}

// \n\n> <:LogoColoured:1210307915316203542> **Rivanode Cloud Hosting**
//> [Click here](<https://rivanode.com>) to visit Rivanode's website and get cheap Bot and Minecraft server hosting!
