import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const source = process.argv[2];
if (!source || !source.endsWith('.tgz')) {
	console.error('Usage: npm run ui:update -- /path/to/usecase-ui-svelte.tgz');
	process.exit(1);
}
const bytes = readFileSync(resolve(source));
const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const directory = resolve('vendor/usecase-ui');
mkdirSync(directory, { recursive: true });
// A content-addressed filename avoids reusing a cached tarball with the same version.
const destination = resolve(directory, `usecase-ui-svelte-${hash}.tgz`);
writeFileSync(destination, bytes);
const result = spawnSync(
	process.platform === 'win32' ? 'npm.cmd' : 'npm',
	['install', `./${relative(process.cwd(), destination).replaceAll('\\', '/')}`],
	{ stdio: 'inherit' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
