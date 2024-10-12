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
	context: ChatInputCommandInteraction<'cached'> | ContextMenuCommandInteraction<'cached'> | Message<true>,
	command: CommonCommand,
	modrole?: string | null
): Promise<boolean> => {


	if (command.botPermissions?.length) {
		const missingPerms: PermissionResolvable[] = [];
		for (const permission of command.botPermissions) {
			if (!context.guild.members.me?.permissions.has(permission)) {
				missingPerms.push(permission);
			}
		}

		if (missingPerms.length) {
			await context.reply({
				content: `I don't have ${formatPerms(missingPerms)} permission(s)`,
				ephemeral: true,
			});
			return false;
		}
	}

	if (command.botChannelPermissions?.length) {
		const missingPerms: PermissionResolvable[] = [];
		for (const permission of command.botChannelPermissions) {
			if (!context.guild.members.me?.permissionsIn(context.channel!).has(permission)) {
				missingPerms.push(permission);
			}
		}

		if (missingPerms.length) {
			await context.reply({
				content: `I don't have ${formatPerms(missingPerms)} permission(s) in this channel`,
				ephemeral: true,
			});
			return false;
		}
	}

	if (command.userChannelPermissions?.length) {
		if (
			(command.category === 'moderation' || command.modrole) &&
			modrole &&
			!command.adminOnly &&
			context.member!.roles.cache.has(modrole)
		) {
			return true;
		}

		const missingPerms: PermissionResolvable[] = [];
		for (const permission of command.userChannelPermissions) {
			if (!context.member!.permissionsIn(context.channel!).has(permission)) {
				missingPerms.push(permission);
			}
		}

		if (missingPerms.length) {
			await context.reply({
				content: `You don't have ${formatPerms(missingPerms)} permission(s) in this channel`,
				ephemeral: true,
			});
			return false;
		}
	}

	if (command.userPermissions?.length) {
		if ((command.category === 'moderation' || command.modrole) && modrole && context.member!.roles.cache.has(modrole)) {
			return true;
		}

		if (
			command.category === 'giveaway' &&
			context.member!.roles.cache.some((r) => r.name.toLowerCase() === 'giveaway manager')
		) {
			return true;
		}

		const missingPerms: PermissionResolvable[] = [];
		const userPerms = typeof command.userPermissions === 'string' ? [command.userPermissions] : command.userPermissions;
		for (const permission of userPerms) {
			const _permission = typeof permission === 'string' ? BigInt(permission) : permission;
			if (!context.member!.permissions.has(_permission)) {
				missingPerms.push(_permission);
			}
		}

		if (missingPerms.length === userPerms.length) {
			await context.reply({
				content: `You don't have ${formatPerms(missingPerms)} permission(s)`,
				ephemeral: true,
			});
			return false;
		}
	}

	return true;
};
