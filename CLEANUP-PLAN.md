# Project Cleanup Plan

## Documentation to Keep (Essential)
- README.md (root)
- docs/MVP-MILESTONE.md
- docs/REACT-QUERY-PATTERNS.md
- docs/CACHE-INVALIDATION-FIX.md
- docs/QUICK-REFERENCE.md
- docs/DATABASE-SCHEMA.md
- docs/DEPLOYMENT.md
- docs/testing.md
- backend/README.md
- apps/clinic-dashboard/README.md
- apps/patient-portal/README.md

## Documentation to Remove (Redundant/Outdated)
- All docs/archive/* (45+ old files)
- All docs/audits/* (audit reports from development)
- All docs/completed/* (completed migration docs)
- All docs/progress/* (old progress logs)
- All docs/sessions/* (chat session logs)
- All docs/roadmaps/* (old roadmaps)
- All docs/project-docs/* (duplicate status files)
- CLOUDFRONT-ISSUE.md (resolved)
- TENANT-CLINIC-MERGE-ROADMAP.md (completed)
- TODO.md (outdated)
- Various duplicate INDEX.md files

## Test Scripts to Keep (Essential)
- scripts/tests/test-live-system.mjs (main E2E test)
- scripts/run-tests.sh (test runner)

## Test Scripts to Remove (Redundant)
- scripts/tests/archive/* (old test versions)
- scripts/tests/legacy/* (legacy tests)
- scripts/tests/active/* (superseded by main test)
- scripts/tests/victory-tests/* (old test versions)
- scripts/archive/old-tests/* (very old tests)
- All audit-*.sh scripts (development audits)
- Debug scripts (debug-jwt.js, etc.)
- Old seed scripts (superseded by current ones)

## Utility Scripts to Keep
- scripts/deploy.sh
- scripts/deploy-backend.sh
- scripts/manage-dev-db.sh
- scripts/seed-dev-data.sh

## Result
- Reduce from ~100+ docs to ~15 essential docs
- Reduce from ~80+ test scripts to ~5 essential scripts
- Keep only production-ready utilities
