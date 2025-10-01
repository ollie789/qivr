# Provider Alignment & RBAC Roadmap

_Updated: 2025-10-05_

The current schema mixes provider details between `users` (role column) and the dedicated `providers` table, and relies on `users.role` for authorization. This roadmap captures the steps required to align the domain model with provider profiles and introduce robust role-based access control.

## Goals
- Treat providers as first-class profiles linked to clinic users (no direct `appointments.provider_id -> users.id` dependency).
- Introduce reusable role/permission tables so authorization does not hinge on a single string column.
- Maintain backward compatibility during migration (UI & services keep working while data moves).

## Provider Alignment
1. **Audit usage**
   - Trace every join/filter that assumes `appointments.provider_id = users.id` (appointments, dashboards, messaging).
   - Document legacy tables (`practitioners`) still referenced in seeding or reporting.
2. **Schema change**
   - Add dual FKs to critical tables: `provider_user_id` (current constraint) + `provider_profile_id` (FK → providers).
   - Backfill `provider_profile_id` from existing data; populate missing provider rows where needed.
   - Create a compatibility view (or materialised view) that joins providers with legacy practitioner metadata to avoid breaking existing queries while the migration is in progress.
3. **Service updates**
   - Update EF entities/AutoMapper to prefer provider profiles; fall back to the user row only during the transition.
   - Refactor reporting/dashboard queries to join via the provider profile and consume profile attributes (specialty, availability, etc.).
4. **Cleanup**
   - Once backfilled, remove deprecated columns, drop the compatibility view, and retire the legacy practitioner table.

## RBAC Expansion
1. **Schema objects**
   - Create `roles`, `permissions`, `role_permissions`, and `user_roles` tables keyed by tenant.
   - Seed system roles (e.g., Admin, Practitioner, Receptionist) and core permissions.
2. **Migration**
   - Backfill `user_roles` based on existing `users.role` values; keep the column for backward compatibility until rollout completes.
   - Add FK enforcement so new users must be assigned via `user_roles`.
3. **Service layer**
   - Expose APIs/helpers for managing roles and permissions per tenant.
   - Update JWT enrichment to read roles from `user_roles`, emitting permission claims for downstream authorization.
4. **Application updates**
   - Refactor authorization checks in the API/UI to use permission checks where appropriate.
   - Update seed scripts/tests to use the new tables and confirm default assignments.
5. **Cleanup**
   - Deprecate the `users.role` column once all consumers rely on the new tables.

## Next Steps
- Draft migrations: add the dual provider FK fields and create RBAC tables with seeds.
- Stage migrations + service updates behind feature flags for safe rollout.
- Update documentation/runbooks after each phase.
