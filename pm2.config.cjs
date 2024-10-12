/**
 * @type {import('pm2').Config}
 */
const configs = {
	apps: [
		{
			name: 'bot',
			script: 'dist/index.js',
			watch: false,
			env: {
				NODE_ENV: 'production',
				FORCE_COLOR: 1,
			},
		},
		{
			name: 'backup',
			script: 'src/index.js',
			cwd: '/home/ubuntu/db-backup',
			watch: false,
		},
	],
};

module.exports = configs;
