# PROM Integration Audit and Remediation Plan

## Audit Summary
- The backend `PromTemplate` entity now persists structured `Questions`, `ScoringMethod`, `ScoringRules`, and requires `Category` and `Frequency`, but the clinic dashboard still posts legacy fields (`schemaJson`, string `scoringMethod`/`scoringRules`) so template creation fails to satisfy the schema and does not store usable JSON.
- Clinic dashboard experiences expect template listings to include full question definitions even though `/api/v1/proms/templates` now returns summary data, and the PROM builder still generates non-GUID question identifiers that the backend discards during scoring.
- Patient portal submissions wrap responses inside a `responses` object; the API expects a raw dictionary keyed by question GUID, so answers are stored against an empty GUID and ignored when calculating scores.

## Remediation Objectives
1. Align clinic dashboard API clients and builder payloads with the new backend DTOs so created templates include category, frequency, structured questions, and scoring metadata.
2. Ensure clinic dashboard experiences resolve full template details as needed (preview, sender wizard) while respecting the summary response returned by the listing endpoint.
3. Guarantee PROM question identifiers are stable GUIDs from creation through submission to support backend scoring rules.
4. Update patient portal submission flows to post the raw answer dictionary the API expects so responses persist correctly.

## Implementation Plan
- Extend the PROM builder UI to capture a required frequency value, emit GUID-based question IDs, and transform builder state into the structured payload (`questions`, `scoringMethod`, `scoringRules`) required by `CreatePromTemplateDto`.
- Refactor `promApi`/`proms` services so `createTemplate` sends the new payload shape, listings expose summary metadata, and detailed fetches hydrate full question/scoring data for consumers.
- Update the PROM sender workflow to fetch detail on demand for the selected template, relying on summaries for discovery but using the detailed DTO for preview, counts, and scheduling metadata.
- Adjust patient portal completion to submit the answer dictionary directly (without the `responses` wrapper) so the backend can map answers back to question GUIDs.

## Expected Outcomes
- Clinic staff can create PROM templates that persist all required metadata without violating database constraints.
- Template previews and sending workflows display complete question sets by resolving detailed templates on demand.
- Patient responses are stored with the correct question identifiers, allowing scoring and reporting to operate end-to-end.
