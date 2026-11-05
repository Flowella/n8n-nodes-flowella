import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
	flowellaResponseMessage,
	flowellaStatusMessage,
} = require('../dist/nodes/Flowella/http-errors.js');

test('maps the status codes the action node surfaces', () => {
	assert.match(flowellaStatusMessage(400), /400/);
	assert.match(flowellaStatusMessage(401), /API key/);
	assert.match(flowellaStatusMessage(402), /subscription/);
	assert.match(flowellaStatusMessage(403), /opted out/);
	assert.match(flowellaStatusMessage(404), /could not find/);
	assert.match(flowellaStatusMessage(429), /Retry On Fail/);
});

test('reads Flowella error.message from the response body', () => {
	assert.equal(
		flowellaResponseMessage({ error: { message: 'Invalid API key' } }),
		'Invalid API key',
	);
	assert.equal(flowellaResponseMessage(null), '');
});
