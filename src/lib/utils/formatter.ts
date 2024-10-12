import { Formatter } from '@imranbarbhuiya/duration';

export const formatter = new Formatter({
	format: 'long',
	patterns: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
});

export const lazyFormattedTime = (avgTime: number) => {
	const patterns = avgTime > 24 * 60 * 60 * 1_000 ? (['y', 'mo', 'w', 'd'] as const) : (['h', 'm', 's'] as const);
	return new Formatter({
		format: 'short',
		patterns,
	}).format(avgTime);
};
