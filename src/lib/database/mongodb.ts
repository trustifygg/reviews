import { connect } from "mongoose";
import { Logger } from "../logger";

export const initDB = () => {
	connect(process.env.DATABASE_URL! as string, {
		// autoIndex: false,
		maxPoolSize: 5,
		connectTimeoutMS: 30_000,
		socketTimeoutMS: 30_000 * 3,
		family: 4,
		serverSelectionTimeoutMS: 30_000,
		heartbeatFrequencyMS: 1_500,
	})
		.then(() => {
			Logger.info("Connected to MongoDB");
		})
		.catch((err) => {
			Logger.error(err);
		});
};
