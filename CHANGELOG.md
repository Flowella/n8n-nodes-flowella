# Changelog

All notable changes to this package are documented here. Versions follow SemVer and track the Flowella API contract they target, not the Flowella app release.

## [Unreleased]

## [0.1.0]

### Changed

- First stable release. The npm `latest` tag points at this version.
- The publish scan waits until the registry serves the new version, then retries while provenance propagates. Scanner output is written to the job log.

## [0.1.0-alpha.1]

### Changed

- Publish uses the npm Trusted Publisher on `publish.yml`. The workflow no longer writes an npm token.

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
