# QIVR Project Status Report
*Last Updated: 2025-08-26*

## Current Issue: Widget Intake Submission

### Summary
The widget intake submission feature is experiencing database-related errors preventing successful submission of patient intake forms to the backend API.

### Work Completed

#### 1. Backend API Fixes
- **TenantMiddleware.cs**: Modified to allow public access to `/api/v1/intake` endpoints without tenant validation
- **IntakeController.cs**: 
  - Simplified to use JSON storage in existing `evaluations` table
  - Added schema-qualified SQL queries (`qivr.` prefix)
  - Implemented default tenant handling for public submissions
- **SecurityHeadersMiddleware.cs**: Updated CORS configuration to allow widget access

#### 2. Database Setup
- Created required tables in PostgreSQL under `qivr` schema:
  - `evaluations` - for storing intake data as JSONB
  - `pain_maps` - for pain point data
  - `intake_submissions` - for submission metadata
- Inserted default tenant (ID: `00000000-0000-0000-0000-000000000001`) using superuser to bypass RLS

#### 3. Widget Frontend
- Running on port 3000
- Configured to submit to `http://localhost:5000/api/v1/intake/submit`
- Includes `X-Clinic-Id` header with tenant ID

### Current Problem

The intake submission endpoint returns an error: 
```json
{"error":"An error occurred processing your submission. Please try again."}
```

### Root Causes Identified

1. **Row-Level Security (RLS)**: PostgreSQL RLS policies are blocking INSERT operations
   - The `qivr_user` lacks BYPASSRLS privilege
   - Even with default tenant in place, inserts to `evaluations` table are blocked
   
2. **Schema/Permission Issues**: 
   - Database operations require superuser privileges to bypass RLS
   - Current application user (`qivr_user`) has insufficient permissions

### Technical Details

#### Database Configuration
- PostgreSQL with `qivr` schema
- User: `qivr_user` (application user without BYPASSRLS)
- Superuser: `oliver` (used for manual interventions)
- RLS enabled on multiple tables including `evaluations` and `tenants`

#### API Endpoint
- URL: `POST /api/v1/intake/submit`
- Headers Required:
  - `Content-Type: application/json`
  - `X-Clinic-Id: <tenant-id>`
- Marked with `[AllowAnonymous]` attribute
- Excluded from tenant middleware validation

### Next Steps - Rethinking the Approach

#### Option 1: Disable RLS for Public Tables
- Create separate tables for public intake that don't have RLS enabled
- Move intake submissions to non-RLS protected tables
- Keep patient data separate from tenant-protected data until processed

#### Option 2: Grant BYPASSRLS to Application User
```sql
ALTER USER qivr_user BYPASSRLS;
```
- Allows application to bypass row-level security
- Security implications need consideration

#### Option 3: Create Dedicated Intake User
- Create a new database user specifically for public intake
- Grant this user INSERT only permissions on specific tables
- Configure connection string for intake endpoints to use this user

#### Option 4: Redesign RLS Policies
- Modify RLS policies to allow INSERT for public/default tenant
- Add policy exceptions for intake-related operations
- Example:
```sql
CREATE POLICY "allow_public_intake" ON qivr.evaluations
  FOR INSERT
  WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001');
```

#### Option 5: Use Application-Level Security
- Remove RLS from intake-related tables
- Implement security at the application layer
- Use RLS only for authenticated tenant operations

### Recommendations

1. **Short-term Fix**: Grant BYPASSRLS to `qivr_user` or create dedicated intake user
2. **Long-term Solution**: Redesign security model to separate public intake from tenant-protected operations
3. **Consider**: Moving to a two-stage process where intake submissions go to a staging area first

### Files Modified in Latest Commit
- `backend/Qivr.Api/Controllers/IntakeController.cs`
- `backend/Qivr.Api/Middleware/TenantMiddleware.cs`
- `backend/Qivr.Api/Middleware/SecurityHeadersMiddleware.cs`
- `backend/Qivr.Api/appsettings.json`
- `apps/widget/src/Widget.tsx`

### Testing Commands

```bash
# Test intake submission
curl -X POST http://localhost:5000/api/v1/intake/submit \
  -H "Content-Type: application/json" \
  -H "X-Clinic-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{"personalInfo":{"firstName":"Test","lastName":"User","dateOfBirth":"1990-01-01","gender":"male"},...}'

# Check database
psql -U oliver -d qivr -c "SELECT * FROM qivr.evaluations WHERE tenant_id = '00000000-0000-0000-0000-000000000001';"

# View backend logs
tail -f /tmp/backend.log  # If logging is configured
```

### Questions to Resolve

1. What is the intended security model for public intake submissions?
2. Should public submissions bypass tenant isolation completely?
3. Is there an existing staging/queue mechanism for unprocessed intakes?
4. What is the workflow after intake submission (assignment to tenant, review process)?

## Action Items

- [ ] Decide on security model approach from options above
- [ ] Implement chosen solution
- [ ] Test end-to-end intake submission
- [ ] Document the security model for future reference
- [ ] Consider adding integration tests for public intake flow
