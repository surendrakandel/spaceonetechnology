import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

// An isolated local worker: no remote bindings, production vars, or secrets.
const directory = resolve('.wrangler/ui-test');
mkdirSync(directory, { recursive: true });
const source = ts.parseConfigFileTextToJson(
	'wrangler.jsonc',
	readFileSync('wrangler.jsonc', 'utf8')
).config;
const config = resolve(directory, 'wrangler.json');
const persist = resolve(directory, 'state');
writeFileSync(
	config,
	JSON.stringify(
		{
			name: 'space-one-ui-test',
			main: resolve(source.main),
			compatibility_date: source.compatibility_date,
			compatibility_flags: source.compatibility_flags,
			assets: { ...source.assets, directory: resolve(source.assets.directory) },
			d1_databases: source.d1_databases.map((d) => ({
				...d,
				remote: false,
				migrations_dir: resolve(d.migrations_dir || 'migrations')
			})),
			r2_buckets: source.r2_buckets.map((d) => ({ ...d, remote: false })),
			vars: {
				APP_ORIGIN: 'http://127.0.0.1:8790',
				MAIL_MODE: 'local',
				EMAIL_FROM: 'test@example.com',
				SIGNUP_ENABLED: 'true'
			}
		},
		null,
		2
	)
);
const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
const migration = spawnSync(
	process.execPath,
	[
		wrangler,
		'd1',
		'migrations',
		'apply',
		'space-one-clients',
		'--local',
		'--config',
		config,
		'--persist-to',
		persist
	],
	{ stdio: 'inherit' }
);
if (migration.status !== 0) process.exit(migration.status || 1);
const server = spawn(
	process.execPath,
	[wrangler, 'dev', '--local', '--config', config, '--persist-to', persist, '--port', '8790'],
	{ stdio: 'inherit' }
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code || 0));
