import { Client, Events } from "discord.js";
import { commands, log } from "..";
import { EventOptions } from "../types";

export const data: EventOptions = {
	name: Events.ClientReady,
};

export async function execute(client: Client): Promise<void> {
	client.application?.commands
		.set(commands.map((command) => command.data))
		.then(() => {
			log.info("Successfully registered commands.");
		});

	log.info(`Logged in as ${client.user?.tag}`);
}
