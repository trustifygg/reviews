import express, { Request, Response } from "express";
import * as bodyParser from "body-parser";
import { getDynamicTime } from "./utils/getDynamicTime";
import * as TopGG from "@top-gg/sdk";
import {
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	WebhookClient,
} from "discord.js";
import { log } from ".";

interface WumpusWebhook {
	webhookTest: boolean;
	userId: string;
	botId: string;
	query: any;
}

const index = async (req: Request, res: Response) => {
	res.status(200).send(`
Vote for reviews
  `);
};

const handleWumpusStoreWebhook = async (req: Request, res: Response) => {
	log.info("request received");

	const webhook = new WebhookClient({
		url: process.env.VOTE_WEBHOOK as string,
	});

	const { userId, botId } = req.body as WumpusWebhook;

	const embed = new EmbedBuilder()
		.setColor(11707101)
		.setTitle("Thanks for the vote!")
		.setDescription(
			`<:happy:1233578049010798775> <@${userId}> has voted for <@${botId}>!`
		)
		.addFields(
			{
				name: "Can vote again",
				value: getDynamicTime(Date.now() + 1000 * 60 * 60 * 12, "RELATIVE"),
				inline: true,
			},
			{
				name: "Vote",
				value: `[🔗 Vote now!](https://wumpus.store/bot/1198639435395375164)`,
				inline: true,
			}
		);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(5)
			.setLabel("Vote now!")
			.setEmoji("🔗")
			.setURL("https://wumpus.store/bot/1198639435395375164")
	);

	await webhook
		.send({
			embeds: [embed],
			components: [row],
			avatarURL:
				"https://cdn.discordapp.com/avatars/1207368481977147443/980c30c5c2e7896201f655a13af1037f.webp?size=80",
			username: "Wumpus Store",
		})
		.then(() => {
			log.info("Successfully sent webhook");
			res.status(200).send();
		})
		.catch((err) => {
			log.error("Unable to send webhook:", err);
			res.send(500).send();
		});
};

interface TopGGWebhook {}

const handleTopGGWebhook = async (req: Request, res: Response) => {
	const webhook = new TopGG.Webhook("57369.c7c.3d");

	webhook.listener((vote) => {
		console.log(vote.user);
	});
};

const handleKofiDonatonWebhook = async (req: Request, res: Response) => {
	const { data } = req.body;

	try {
		const webhook = new WebhookClient({
			url: process.env.KOFI_WEBHOOK as string,
		});

		const embed = new EmbedBuilder()
			.setColor(16735578)
			.setTitle("Thanks for the donation!")
			.setDescription(
				`<a:pepe_money:1157767430987329659> ${data.from_name} has made a donation of ${data.amount}!\n\n\`\`\`${data.message}\`\`\``
			)
			.addFields(
				{
					name: "Donated",
					value: getDynamicTime(Date.now(), "RELATIVE"),
					inline: true,
				},
				{
					name: "Donate",
					value: `[🔗 Donate now!](https://ko-fi.com/solusdev)`,
					inline: true,
				}
			);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setStyle(5)
				.setLabel("Donate now!")
				.setEmoji("🔗")
				.setURL(data.message.url)
		);

		await webhook
			.send({
				content: "[TEST]",
				embeds: [embed],
				components: [row],
				avatarURL: "https://storage.ko-fi.com/cdn/nav-logo-stroke.png",
				username: "Ko-fi",
			})
			.then(() => {
				log.info("Successfully sent webhook");
				res.status(200).send();
			})
			.catch((err) => {
				log.error("Unable to send webhook:", err);
				res.send(500).send();
			});
	} catch (err) {
		res.send(500).send();
		log.error("Unable to complete request:", err);
	}
};

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", index);
app.post("/wumpusstorewebhook", handleWumpusStoreWebhook);
app.post("/topggwebhook", handleTopGGWebhook);
app.post("/kofidonationwebhook", handleKofiDonatonWebhook);

app.listen(3069, () => {
	log.info("Server started on port 3069");
});
