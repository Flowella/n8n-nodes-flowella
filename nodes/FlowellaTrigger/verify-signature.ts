import { createHmac, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 hex of the raw body. Matches Flowella `signOutboundWebhookPayload`. */
export function signFlowellaWebhook(secret: string, rawBody: string): string {
	return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyFlowellaSignature(
	signatureHex: string | undefined,
	secret: string,
	rawBody: string,
): boolean {
	if (!signatureHex || !secret) return false;
	const expected = signFlowellaWebhook(secret, rawBody);
	try {
		const received = Buffer.from(signatureHex.trim(), 'hex');
		const wanted = Buffer.from(expected, 'hex');
		if (received.length === 0 || received.length !== wanted.length) return false;
		return timingSafeEqual(received, wanted);
	} catch {
		return false;
	}
}
