import { ActivityType, Client, Events } from "discord.js";
import { commands, log } from "..";
import { EventOptions } from "../types";
import { ReviewDB } from "../models.db";

export const data: EventOptions = {
	name: Events.ClientReady,
};

export async function execute(client: Client): Promise<void> {
	client.application?.commands
		.set(commands.map((command) => command.data))
		.then(() => {
			log.info("Successfully registered commands.");
		});

	setInterval(async () => {
		client.user?.setPresence({
			activities: [
				{
					name: `${(await ReviewDB.countDocuments()).toLocaleString()} reviews`,
					type: ActivityType.Watching,
				},
			],
		});
	}, 10000);

	log.info(`Logged in as ${client.user?.tag}`);
}
