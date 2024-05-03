import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	TextChannel,
	ForumChannel,
	NewsChannel,
	Role,
} from "discord.js";
import { createGuild, getOrCreateGuild } from "../../db";

export const data = new SlashCommandBuilder()
	.setName("config")
	.setDescription("Configure the Reviews in your server.")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false)
	.addSubcommand((sub) =>
		sub
			.setName("channel")
			.setDescription("Set the channel where reviews will be sent.")
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription("The channel where reviews will be sent.")
					.setRequired(true)
					.addChannelTypes(
						ChannelType.GuildText,
						ChannelType.GuildAnnouncement,
						ChannelType.GuildForum
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("logs")
			.setDescription("Set the logs channel.")
			.addChannelOption((option) =>
				option
					.setName("channel")
					.setDescription("The channel where logs will be sent.")
					.setRequired(true)
					.addChannelTypes(ChannelType.GuildText)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("review-role")
			.setDescription(
				"Set the role that will be required when submitting a review."
			)
			.addRoleOption((option) =>
				option
					.setName("role")
					.setDescription("The role that will be required.")
					.setRequired(true)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("anonymous-reviews")
			.setDescription("Toggle anonymous reviews.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable anonymous reviews or 'no' to disable them."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("threads")
			.setDescription("Set whether to enable ot disable threads.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable threads or 'no' to disable them."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("review-button")
			.setDescription("Set whether to enable or disable review button.")
			.addStringOption((option) =>
				option
					.setName("toggle")
					.setDescription(
						"Type 'yes' to enable review button or 'no' to disable it."
					)
					.setRequired(true)
					.setChoices(
						{ name: "Enable", value: "yes" },
						{ name: "Disable", value: "no" }
					)
			)
	)
	.addSubcommand((sub) =>
		sub
			.setName("reset")
			.setDescription("Reset the configuration of the bot.")
			.addStringOption((option) =>
				option
					.setName("confirm")
					.setDescription("Type 'confirm' to reset the configuration.")
					.setRequired(true)
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const { options } = interaction;
	const data = await getOrCreateGuild(interaction.guildId!);

	switch (options.getSubcommand()) {
		case "channel":
			{
				const channel: TextChannel | NewsChannel | ForumChannel =
					options.getChannel("channel", true);
				data.channel = channel.id;
				await data.save();
				await interaction.reply({
					content: `Reviews will now be sent to ${channel.toString()}`,
					ephemeral: true,
				});
			}
			break;

		case "logs":
			{
				const channel: TextChannel = options.getChannel("channel", true);
				data.logsChannel = channel.id;
				await data.save();
				await interaction.reply({
					content: `Logs will now be sent to ${channel.toString()}`,
					ephemeral: true,
				});
			}
			break;

		case "role":
			{
				const role: Role = options.getRole("role", true) as Role;
				data.reviewRole = role.id;
				await data.save();
				await interaction.reply({
					content: `Reviews will now require the role ${role.toString()}`,
					ephemeral: true,
				});
			}
			break;

		case "anonymous-reviews":
			{
				const toggle: string = options.getString("toggle", true);
				if (toggle === "yes") {
					data.anonymousReviews = true;
					await data.save();
					await interaction.reply({
						content: "Anonymous reviews have been enabled.",
						ephemeral: true,
					});
				} else if (toggle === "no") {
					data.anonymousReviews = false;
					await data.save();
					await interaction.reply({
						content: "Anonymous reviews have been disabled.",
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content:
							"You need to type 'yes' to enable anonymous reviews or 'no' to disable them.",
						ephemeral: true,
					});
				}
			}
			break;

		case "threads":
			{
				const toggle: string = options.getString("toggle", true);
				if (toggle === "yes") {
					data.createThreads = true;
					await data.save();
					await interaction.reply({
						content: "Threads have been enabled.",
						ephemeral: true,
					});
				} else if (toggle === "no") {
					data.createThreads = false;
					await data.save();
					await interaction.reply({
						content: "Threads have been disabled.",
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content:
							"You need to type 'yes' to enable threads or 'no' to disable them.",
						ephemeral: true,
					});
				}
			}
			break;

		case "reset":
			{
				const confirm: string = options.getString("confirm", true);
				if (confirm !== "confirm") {
					await interaction.reply({
						content: "You need to type 'confirm' to reset the configuration.",
						ephemeral: true,
					});
					return;
				}

				await data
					.deleteOne()
					.then(async () => await createGuild(interaction.guildId as string));

				await interaction.reply({
					content: "The configuration has been reset.",
					ephemeral: true,
				});
			}
			break;
	}
}
