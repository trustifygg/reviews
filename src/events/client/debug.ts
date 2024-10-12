import type { ClientEvents } from '#types/events';

import { Logger } from '#lib/logger';

const debugEvent: ClientEvents['Debug'] = (message) => {
	Logger.djsDebug(message);
};

export default debugEvent;
