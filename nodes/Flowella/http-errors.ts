import { NodeApiError } from 'n8n-workflow';
import type {
	IExecuteSingleFunctions,
	INodeExecutionData,
	IN8nHttpFullResponse,
} from 'n8n-workflow';

const STATUS_MESSAGES: Record<number, string> = {
	400: 'Flowella rejected the request (400). Check the field values.',
	401: 'Flowella rejected the API key (401). Create a new key in Settings, then API keys.',
	402: 'Flowella requires an active subscription before this call (402).',
	403: 'Flowella refused the call (403). The contact may be opted out, or WhatsApp is not connected.',
	404: 'Flowella could not find that record (404).',
	429: 'Flowella rate limited this request (429). Enable Retry On Fail on this node, then run it again.',
};

export function flowellaStatusMessage(status: number): string {
	return STATUS_MESSAGES[status] ?? `Flowella returned HTTP ${status}.`;
}

export function flowellaResponseMessage(body: unknown): string {
	if (!body || typeof body !== 'object') return '';
	const error = (body as { error?: { message?: unknown } }).error;
	return typeof error?.message === 'string' ? error.message : '';
}

/** Declarative post-receive hook. Successful responses pass through. */
export async function mapFlowellaHttpError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode ?? 0;
	if (status >= 200 && status < 300) return items;
	const apiMessage = flowellaResponseMessage(response.body);
	const message = flowellaStatusMessage(status);
	throw new NodeApiError(
		this.getNode(),
		{ message: apiMessage || message, httpCode: String(status) },
		{
			message,
			description: status === 429 ? `${message} ${apiMessage}`.trim() : apiMessage || message,
			httpCode: String(status),
		},
	);
}
