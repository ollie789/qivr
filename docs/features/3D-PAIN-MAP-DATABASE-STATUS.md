# 3D Pain Map - Database Status

**Date:** November 20, 2025
**Status:** ✅ No Migration Needed

---

## Summary

**The database already has all required fields for 3D pain map support.**

Migration `20251119101931_AddPainDrawingSupport` was applied on **November 19, 2025 at 10:35:29 UTC**.

---

## Existing Schema

### pain_maps Table

```sql
CREATE TABLE qivr.pain_maps (
    -- Core fields
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    evaluation_id UUID NOT NULL,
    body_region TEXT NOT NULL,
    anatomical_code TEXT,              -- SNOMED CT codes
    coordinates JSONB,                 -- Legacy x,y,z
    pain_intensity INTEGER,            -- 0-10
    pain_type TEXT,
    pain_quality TEXT[],
    onset_date TIMESTAMP,
    notes TEXT,

    -- ✅ 3D Pain Map Fields (Already Exist)
    avatar_type TEXT,                  -- male, female, child
    body_subdivision TEXT,             -- simple, dermatome, myotome
    view_orientation TEXT,             -- front, back, left, right
    depth_indicator TEXT,              -- superficial, deep
    submission_source TEXT,            -- portal, mobile, clinic
    drawing_data_json TEXT,            -- ✅ Stores 3D regions here

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Foreign keys
    FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id),
    FOREIGN KEY (evaluation_id) REFERENCES qivr.evaluations(id)
);
```

---

## Migration History

### Applied Migration

**File:** `20251119101931_AddPainDrawingSupport.cs`

**Applied:** November 19, 2025 at 10:35:29 UTC

**Changes:**

```sql
ALTER TABLE qivr.pain_maps
ADD COLUMN avatar_type TEXT,
ADD COLUMN body_subdivision TEXT,
ADD COLUMN view_orientation TEXT,
ADD COLUMN depth_indicator TEXT,
ADD COLUMN submission_source TEXT,
ADD COLUMN drawing_data_json TEXT;
```

**Status:** ✅ Successfully applied to production

---

## Data Storage

### 3D Pain Map Format

The `drawing_data_json` column stores:

```json
{
  "regions": [
    {
      "meshName": "back_left_lower_back",
      "anatomicalName": "Left Lower Back",
      "quality": "sharp",
      "intensity": 8,
      "snomedCode": "37822005"
    },
    {
      "meshName": "front_left_shoulder",
      "anatomicalName": "Left Shoulder (Front)",
      "quality": "dull",
      "intensity": 5,
      "snomedCode": "16982005"
    }
  ],
  "cameraView": "front",
  "timestamp": "2025-11-20T15:43:00Z"
}
```

### Legacy Format (Still Supported)

Old pain points stored in `coordinates` JSONB:

```json
{
  "x": 150,
  "y": 200,
  "z": 0
}
```

---

## Verification

### Check Migration Status

```sql
-- Check if migration was applied
SELECT * FROM qivr.__efmigrationshistory
WHERE migration_id = '20251119101931_AddPainDrawingSupport';

-- Result:
-- migration_id: 20251119101931_AddPainDrawingSupport
-- product_version: 8.0.0
```

### Check Column Exists

```sql
-- Verify drawing_data_json column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'qivr'
  AND table_name = 'pain_maps'
  AND column_name = 'drawing_data_json';

-- Result:
-- column_name: drawing_data_json
-- data_type: text
-- is_nullable: YES
```

### Check Data

```sql
-- Count pain maps with 3D region data
SELECT
    COUNT(*) as total_pain_maps,
    COUNT(drawing_data_json) as with_3d_data,
    COUNT(drawing_data_json) * 100.0 / COUNT(*) as percentage_3d
FROM qivr.pain_maps;
```

---

## Database Configuration

### Production Database

- **Instance:** qivr-dev-db
- **Endpoint:** qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com
- **Port:** 5432
- **Engine:** PostgreSQL 15.7
- **Status:** Available
- **Storage:** 20 GB (gp3, 3000 IOPS)
- **Backup:** 7 days retention

### Connection String

```
Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;
Port=5432;
Database=qivr;
Username=qivr_user;
Password=***;
SSL Mode=Require;
```

---

## No Action Required

### ✅ Database is Ready

- All columns exist
- Migration applied successfully
- Production database available
- No schema changes needed

### ✅ Backward Compatible

- New 3D format uses `drawing_data_json`
- Legacy format uses `coordinates`
- Both can coexist
- No data migration required

### ✅ API Integration

- IntakeController stores 3D regions
- Worker extracts regions for AI
- EvaluationViewer displays 3D map
- All using existing schema

---

## Future Considerations

### Potential Optimizations (Not Required Now)

1. **JSONB Type**

   ```sql
   -- Could change from TEXT to JSONB for better querying
   ALTER TABLE qivr.pain_maps
   ALTER COLUMN drawing_data_json TYPE JSONB USING drawing_data_json::jsonb;

   -- Benefits:
   -- - Faster JSON queries
   -- - GIN indexes for region searches
   -- - Validation at database level
   ```

2. **Indexes**

   ```sql
   -- Index for region queries
   CREATE INDEX idx_pain_maps_regions
   ON qivr.pain_maps USING GIN ((drawing_data_json::jsonb));

   -- Index for specific region searches
   CREATE INDEX idx_pain_maps_mesh_names
   ON qivr.pain_maps USING GIN (
       (drawing_data_json::jsonb -> 'regions')
   );
   ```

3. **Materialized View**
   ```sql
   -- Pre-aggregate pain regions for analytics
   CREATE MATERIALIZED VIEW qivr.pain_region_summary AS
   SELECT
       region->>'meshName' as mesh_name,
       region->>'anatomicalName' as anatomical_name,
       COUNT(*) as report_count,
       AVG((region->>'intensity')::int) as avg_intensity,
       ARRAY_AGG(DISTINCT region->>'quality') as pain_qualities
   FROM qivr.pain_maps,
        jsonb_array_elements(drawing_data_json::jsonb->'regions') as region
   WHERE drawing_data_json IS NOT NULL
   GROUP BY region->>'meshName', region->>'anatomicalName';
   ```

---

## Monitoring

### Database Metrics

```sql
-- Monitor 3D pain map adoption
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_submissions,
    COUNT(drawing_data_json) as with_3d_map,
    COUNT(drawing_data_json) * 100.0 / COUNT(*) as adoption_rate
FROM qivr.pain_maps
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Storage Usage

```sql
-- Check drawing_data_json storage size
SELECT
    pg_size_pretty(SUM(pg_column_size(drawing_data_json))) as json_size,
    COUNT(*) as record_count,
    pg_size_pretty(AVG(pg_column_size(drawing_data_json))) as avg_size
FROM qivr.pain_maps
WHERE drawing_data_json IS NOT NULL;
```

---

## Summary

✅ **No Migration Needed**

- All fields already exist
- Migration applied Nov 19, 2025
- Production database ready

✅ **Schema Complete**

- `drawing_data_json` stores 3D regions
- `avatar_type`, `view_orientation` for metadata
- `anatomical_code` for SNOMED CT

✅ **Backward Compatible**

- Legacy `coordinates` still supported
- No breaking changes
- Gradual migration path

✅ **Production Ready**

- Database available
- API integrated
- Worker processing
- Dashboard displaying

**No database changes required for 3D pain map feature!**
