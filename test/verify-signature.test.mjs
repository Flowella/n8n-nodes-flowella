import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
	signFlowellaWebhook,
	verifyFlowellaSignature,
} = require('../dist/nodes/FlowellaTrigger/verify-signature.js');

test('accepts the hex HMAC of the raw body', () => {
	const body = '{"type":"message.received","data":{"text":"hi"}}';
	const secret = 'whsec_test';
	const signature = signFlowellaWebhook(secret, body);
	assert.equal(verifyFlowellaSignature(signature, secret, body), true);
});

test('rejects a tampered body and a wrong secret', () => {
	const body = '{"type":"message.received"}';
	const signature = signFlowellaWebhook('whsec_test', body);
	assert.equal(verifyFlowellaSignature(signature, 'whsec_test', `${body} `), false);
	assert.equal(verifyFlowellaSignature(signature, 'other', body), false);
	assert.equal(verifyFlowellaSignature(undefined, 'whsec_test', body), false);
});
