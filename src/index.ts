import { config } from "dotenv";
import BotClient from "./lib/modules/BotClient";
import { initDB } from "./lib/database/mongodb";

const client = new BotClient();
config();

initDB();
client.start();
