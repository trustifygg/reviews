import { Client, PermissionResolvable, SlashCommandBuilder } from "discord.js";
import { botClient } from ".";

export declare interface Command {
	data: SlashCommandBuilder;
	execute: (client: typeof botClient, ...args: string[]) => void;
}

export declare interface EventOptions {
	name: string;
	once?: boolean;
}

export declare interface Event {
	data: EventOptions;
	execute: (client: typeof botClient, ...args: string[]) => void;
}
