import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const publish = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');

function distTagFor(version) {
	if (!version.includes('-')) return 'latest';
	return version
		.slice(version.indexOf('-') + 1)
		.split('.')[0]
		.split('-')[0];
}

test('publish workflow passes a dist-tag to npm publish', () => {
	// `n8n-node release` runs a bare `npm publish` in CI and inherits
	// process.env, so NPM_CONFIG_TAG is how the tag reaches npm.
	assert.match(publish, /NPM_CONFIG_TAG/);
	assert.match(publish, /GITHUB_REF_NAME|package\.json.*version/);
});

test('publish workflow derives the dist-tag instead of hardcoding alpha', () => {
	assert.doesNotMatch(publish, /NPM_CONFIG_TAG\s*[:=]\s*"?alpha"?/);
});

test('dist-tag derivation matches npm prerelease rules', () => {
	assert.equal(distTagFor('0.1.0-alpha.0'), 'alpha');
	assert.equal(distTagFor('1.2.3-rc.1'), 'rc');
	assert.equal(distTagFor('0.1.0'), 'latest');
	assert.equal(distTagFor('2.0.0'), 'latest');
});

test('publish workflow authenticates with GitHub OIDC, not a stored npm token', () => {
	assert.match(publish, /id-token:\s*write/);
	assert.doesNotMatch(publish, /secrets\.NPM_TOKEN/);
	assert.doesNotMatch(publish, /_authToken/);
});
test('publish workflow requires the npm-publish environment approval gate', () => {
	assert.match(publish, /environment:\s*npm-publish/);
});


test('publish workflow sets public access for a first provenance publish', () => {
	// npm: "Can't generate provenance for new or private package, you must
	// set `access` to public" — a new package has no public default yet.
	assert.match(publish, /NPM_CONFIG_ACCESS/);
});

test('publish workflow retries the registry scan and keeps its output', () => {
	// 0.1.0-alpha.1: npm said the package may take a few minutes to appear,
	// the scanner then failed closed, and `npx | tee` block-buffered Node's
	// stdout so the job log never showed why grep missed the success line.
	const scan = publish.slice(publish.indexOf('Scan the published package'));
	assert.match(scan, /for attempt in/);
	assert.match(scan, /npx --yes @n8n\/scan-community-package/);
	assert.match(scan, />scan\.txt 2>&1/);
	assert.doesNotMatch(scan, /scan-community-package[^\n]*\| tee/);
	assert.match(scan, /passed all security checks/);
	assert.match(scan, /ESLint violations/);
	assert.match(scan, /cat scan\.txt/);
});
