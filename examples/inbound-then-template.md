# Inbound message, then a template

This recipe uses both nodes in one workflow.

1. Import `inbound-then-template.workflow.json` into n8n.
2. Create a Flowella API credential with an organisation key and the webhook signing secret.
3. Attach that credential to **Flowella Trigger** and **Flowella**.
4. Copy the trigger's production URL into Flowella **Settings → Webhooks**. Subscribe at least to `message.received`.
5. On **Flowella**, set the template id (or pick it from the list), the template WABA id, the WhatsApp channel id, and map the recipient phone from `{{$json.contactPhone}}`.
6. Send a WhatsApp message to the connected number. The trigger fires, then the template send runs.

Flowella disables a webhook endpoint after 10 consecutive delivery failures. Keep the workflow active while you are testing.
