# Changelog

All notable changes to this package are documented here. Versions follow SemVer and track the Flowella API contract they target, not the Flowella app release.

## [Unreleased]

### Added

- Flowella API credential (`GET /v1/ping`) and declarative action node for messages, conversations, contacts, opt-outs, templates, and analytics.
- Flowella Trigger with manual webhook registration and HMAC verification of `X-Flowella-Signature`.
- OpenAPI contract generator and CI drift check against `https://api.flowella.io/v1/openapi.json` (contract 1.1.0).
- Example workflow for an inbound message followed by a template send.
