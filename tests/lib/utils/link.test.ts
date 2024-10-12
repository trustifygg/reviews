import { parseDomain } from '#util/link';

describe('Domain Validation', () => {
	test('should return true for valid domain', () => {
		expect(parseDomain('https://google.com')).not.toBe(null);
	});

	test('should return false for invalid domain', () => {
		expect(parseDomain('invalid')).toBe(null);
	});

	test('should return false for domain with path', () => {
		expect(parseDomain('https://google.com/path')).toBe(null);
	});

	test('should return false for domain with protocol other than http(s?)', () => {
		expect(parseDomain('file:///D:/Discord/R.O.T.I/tests/lib/utils/link.test.ts')).toBe(null);
	});
});
