import type { BooleanString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	interface Env {
		DEBUG: BooleanString;
		DISCORD_TOKEN: string;
		ERROR_WEBHOOK_URL: string;
		MONGODB_SRV: string;
		REPORT_WEBHOOK_URL: string;
		STATUS_WEBHOOK_URL: string;
		TOPGG_TOKEN: string;
	}
}