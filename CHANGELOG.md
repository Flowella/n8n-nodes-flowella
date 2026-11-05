# Changelog

All notable changes to this package are documented here. Versions follow SemVer and track the Flowella API contract they target, not the Flowella app release.

## [Unreleased]

### Added

- Flowella API credential (`GET /v1/ping`) and declarative action node for messages, conversations, contacts, opt-outs, templates, and analytics.
- Flowella Trigger with manual webhook registration and HMAC verification of `X-Flowella-Signature`.
- OpenAPI contract generator and CI drift check against `https://api.flowella.io/v1/openapi.json` (contract 1.1.0).
- Example workflow for an inbound message followed by a template send.

### Changed

- Action calls map HTTP 400, 401, 402, 403, 404, and 429 to an explicit node error. A 429 tells you to enable Retry On Fail.
- The trigger description points at `https://app.flowella.io` and `/{organisation}/settings/webhooks`.
- README includes one sample payload per product event, plus `webhook.test`.
- Contract drift check names added or removed query and body fields, and a second generate is a no-op.
