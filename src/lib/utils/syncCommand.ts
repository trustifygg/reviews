import { blue, green, red } from 'colorette';
import {
	ApplicationCommand,
	ApplicationCommandType,
	type Client,
	type RESTPostAPIApplicationCommandsJSONBody,
	type ApplicationCommandData,
} from 'discord.js';

import { Constants } from './constants';

import { Logger } from '../logger';

export const syncCommands = async (client: Client<true>) => {
	if (!client.application.owner) {
		await client.application.fetch().catch(() => null);
	}

	const currentCommands = await client.application.commands.fetch();

	const arrayOfChatInputCommands = client.chatInputCommands.filter((cmd) => !cmd.ownerOnly).map((cmd) => cmd.data);

	Logger.debug(`Found ${arrayOfChatInputCommands.length} chat input commands`);

	const arrayOfContextmenuCommands = client.contextmenuCommands
		.filter((cmd) => !cmd.ownerOnly)
		.map(
			(cmd) =>
				({
					name: cmd.name,
					type: cmd.type,
				}) as RESTPostAPIApplicationCommandsJSONBody
		);

	Logger.debug(`Found ${arrayOfContextmenuCommands.length} contextmenu commands`);

	const arrayOfGlobalCommands = [...arrayOfChatInputCommands, ...arrayOfContextmenuCommands];

	Logger.debug(`Found ${arrayOfGlobalCommands.length} global commands`);

	const arrayOfOwnerCommands = [
		...client.contextmenuCommands
			.filter((cmd) => cmd.ownerOnly ?? false)
			.map(
				(cmd) =>
					({
						name: cmd.name,
						type: cmd.type,
					}) as RESTPostAPIApplicationCommandsJSONBody
			),
		...client.chatInputCommands.filter((cmd) => cmd.ownerOnly).map((cmd) => cmd.data),
	];

	Logger.debug(`Found ${arrayOfOwnerCommands.length} owner commands`);

	const promises = [];

	const newGlobalCommands = arrayOfGlobalCommands.filter(
		(command) => !currentCommands.some((c) => c.name === command.name && !c.guildId)
	);

	Logger.debug(`Found ${newGlobalCommands.length} new global commands to add`);

	for (const newCommand of newGlobalCommands) {
		promises.push(client.application.commands.create(newCommand));
	}

	const newOwnerOnlyCommands = arrayOfOwnerCommands.filter(
		(command) => !currentCommands.some((c) => c.name === command.name && c.guildId !== Constants.ownerGuild)
	);

	Logger.debug(`Found ${newOwnerOnlyCommands.length} new owner-only commands to add`);

	for (const newOwnerOnlyCommand of newOwnerOnlyCommands) {
		promises.push(client.application.commands.create(newOwnerOnlyCommand, Constants.ownerGuild));
	}

	const deletedCommands = currentCommands
		.filter(
			(command) =>
				!arrayOfGlobalCommands.some((c) => c.name === command.name && !command.guildId) &&
				!arrayOfOwnerCommands.some((c) => c.name === command.name && command.guildId === Constants.ownerGuild)
		)
		.toJSON();

	Logger.debug(`Found ${deletedCommands.length} commands to delete`);

	for (const deletedCommand of deletedCommands) {
		promises.push(deletedCommand.delete());
	}

	const allCommands = [...arrayOfGlobalCommands, ...arrayOfOwnerCommands].filter((command) =>
		currentCommands.some((c) => c.name === command.name)
	);

	for (const command of allCommands) {
		const newCommand = command;
		const previousCommand = currentCommands.find((c) => c.name === command.name)!;
		let modified = false;
		if (
			newCommand.type === ApplicationCommandType.ChatInput &&
			previousCommand.description !== newCommand.description
		) {
			Logger.debug(
				`Updating description for command ${newCommand.name} from ${red(previousCommand.description)} to ${green(
					newCommand.description
				)}`
			);

			modified = true;
		}

		if (
			(!newCommand.type || newCommand.type === ApplicationCommandType.ChatInput) &&
			!ApplicationCommand.optionsEqual(previousCommand.options, newCommand.options ?? [])
		) {
			Logger.debug(`Updating options for command ${blue(newCommand.name)}`);
			modified = true;
		}

		if (
			previousCommand.type !== ApplicationCommandType.ChatInput &&
			(previousCommand.type === ApplicationCommandType.Message
				? ApplicationCommandType.Message
				: ApplicationCommandType.User) !== newCommand.type
		) {
			Logger.debug(
				`Updating type for command ${newCommand.name} from ${red(previousCommand.type)} to ${green(newCommand.type!)}`
			);
			modified = true;
		}

		if (
			previousCommand.defaultMemberPermissions?.bitfield.toString() !==
			newCommand.default_member_permissions?.toString()
		) {
			Logger.debug(
				`Updating defaultMemberPermissions for command ${newCommand.name} from ${red(
					`${previousCommand.defaultMemberPermissions?.toArray().toString()}`
				)} to ${green(newCommand.default_member_permissions!)}`
			);
			modified = true;
		}

		if (typeof newCommand.dm_permission === 'boolean' && previousCommand.dmPermission !== newCommand.dm_permission) {
			Logger.debug(
				`Updating dmPermission for command ${newCommand.name} from ${red(`${previousCommand.dmPermission}`)} to ${green(
					`${newCommand.dm_permission}`
				)}`
			);
			modified = true;
		}

		if (modified) {
			Logger.debug(`Updating command ${blue(newCommand.name)}`);
			// TODO: fix later
			promises.push(previousCommand.edit(newCommand as ApplicationCommandData));
		}
	}

	return Promise.allSettled(promises);
};
