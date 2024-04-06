import {
	ActivityType,
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
} from "discord.js";
import { readdirSync } from "fs";
import { resolve } from "path";
import { Command, Event } from "./types";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { ILogObj, Logger } from "tslog";
dotenv.config();

export const log: Logger<ILogObj> = new Logger({
	minLevel: parseInt((process.env.LOG_LEVEL as string) || "3", 10),
	hideLogPositionForProduction: true,
});

export const botClient = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel, Partials.Message, Partials.User],
	presence: {
		status: "dnd",
		activities: [
			{
				name: "Hello World!",
				type: ActivityType.Listening,
			},
		],
	},
});

export const commands = new Collection<string, any>();

async function main() {
	// Handle Commands
	const commandsPath = resolve(__dirname, "commands");
	const commandFolders = readdirSync(commandsPath);

	for (const folder of commandFolders) {
		const folderPath = resolve(commandsPath, folder);
		const commandFiles = readdirSync(folderPath).filter((file) =>
			file.endsWith(".ts")
		);

		for (const file of commandFiles) {
			const filePath = resolve(folderPath, file);
			try {
				const command = require(filePath) as Command;

				if (!command.data || typeof command.data !== "object") {
					console.warn(`Command '${file}' is missing a valid 'data' property.`);
					continue;
				}

				commands.set(command.data.name, command);
			} catch (error) {
				console.error(`Failed to load command '${file}':`, error);
			}
		}
	}

	// Handle Events
	const eventsPath = resolve(__dirname, "events");
	const eventFiles = readdirSync(eventsPath).filter((file) =>
		file.endsWith(".ts")
	);

	for (const file of eventFiles) {
		const filePath = resolve(eventsPath, file);
		const event = require(filePath) as Event;
		botClient.on(event.data.name, event.execute);
	}

	await mongoose
		.connect(process.env.DATABASE_URL as string)
		.then(() => log.info("Connected to MongoDB."))
		.catch((e) => log.error("Failed to connect to MongoDB.", e));

	await botClient.login(process.env.BOT_TOKEN);
}

main().catch((e) => {
	throw e;
});
