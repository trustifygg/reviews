import {
	PermissionsBitField,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type PermissionResolvable,
} from 'discord.js';

import type { CommonCommand } from '#types/command';
import type { Message } from 'discord.js';

import { toTitleCase } from '#util/utils';

const formatPerms = (missingPerms: PermissionResolvable[]) => {
	const permsString = new PermissionsBitField(missingPerms).toArray().join(', ');
	return ` \`${toTitleCase(permsString)}\` `;
};

export const havePermission = async (
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | Message,
	command: CommonCommand
): Promise<boolean> => {
	if (!interaction.guild) return true;

	try {
		const member = 'member' in interaction ? interaction.member : interaction.guild.members.cache.get(interaction.author.id);
		if (!member) return false;

		// Check if command is owner only
		if (command.ownerOnly && !command.owners?.includes(member.user.id)) {
			await interaction.reply({
				content: 'This command is restricted to bot owners only.',
				ephemeral: true
			});
			return false;
		}

		// Check user permissions
		if (command.userPermissions?.length) {
			const missingPerms = member.permissions instanceof PermissionsBitField
				? command.userPermissions.filter(perm => !member.permissions.has(perm))
				: [];

			if (missingPerms.length) {
				await interaction.reply({
					content: `You need the following permissions to use this command:${formatPerms(missingPerms)}`,
					ephemeral: true
				});
				return false;
			}
		}

		// Check bot permissions
		if (command.botPermissions?.length) {
			const bot = interaction.guild.members.me;
			if (!bot) return false;

			const missingPerms = command.botPermissions.filter(perm => !bot.permissions.has(perm));
			if (missingPerms.length) {
				await interaction.reply({
					content: `I need the following permissions to execute this command:${formatPerms(missingPerms)}`,
					ephemeral: true
				});
				return false;
			}
		}

		// Check channel-specific permissions
		if (command.botChannelPermissions?.length || command.userChannelPermissions?.length) {
			const channel = 'channel' in interaction ? interaction.channel : null;
			if (!channel) return false;

			if (command.botChannelPermissions?.length) {
				const botPerms = channel.permissionsFor(interaction.guild.members.me!);
				if (!botPerms) return false;

				const missingPerms = command.botChannelPermissions.filter(perm => !botPerms.has(perm));
				if (missingPerms.length) {
					await interaction.reply({
						content: `I need the following channel permissions to execute this command:${formatPerms(missingPerms)}`,
						ephemeral: true
					});
					return false;
				}
			}

			if (command.userChannelPermissions?.length) {
				const userPerms = channel.permissionsFor(member);
				if (!userPerms) return false;

				const missingPerms = command.userChannelPermissions.filter(perm => !userPerms.has(perm));
				if (missingPerms.length) {
					await interaction.reply({
						content: `You need the following channel permissions to use this command:${formatPerms(missingPerms)}`,
						ephemeral: true
					});
					return false;
				}
			}
		}

		return true;
	} catch (error) {
		console.error('Permission check error:', error);
		await interaction.reply({
			content: 'An error occurred while checking permissions. Please try again later.',
			ephemeral: true
		}).catch(() => null);
		return false;
	}
};
