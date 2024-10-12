declare module 'dotenv' {
	interface Env {
		DEBUG: boolean;
		DISCORD_TOKEN: string;
		ERROR_WEBHOOK_URL: string;
		MONGODB_SRV: string;
		REPORT_WEBHOOK_URL: string;
		STATUS_WEBHOOK_URL: string;
		TOPGG_TOKEN: string;
	}
}
