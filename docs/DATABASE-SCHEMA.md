# Database Schema Documentation

## Overview
Clean, unified schema after tenant-clinic merge completion. All clinic data is now stored directly in the `tenants` table.

## Core Tables

### tenants
**Primary entity for clinic/organization data**
```sql
id          UUID PRIMARY KEY
slug        TEXT UNIQUE NOT NULL
name        TEXT NOT NULL  
settings    JSONB NOT NULL
created_at  TIMESTAMPTZ NOT NULL
updated_at  TIMESTAMPTZ NOT NULL
description VARCHAR(1000)
address     VARCHAR(500)
city        VARCHAR(100)
state       VARCHAR(50)
zip_code    VARCHAR(20)
country     VARCHAR(100)
phone       VARCHAR(20)
email       VARCHAR(255)
is_active   BOOLEAN DEFAULT true
```

### users
**All user types (clinicians, patients, admins)**
```sql
id           UUID PRIMARY KEY
tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE
email        TEXT UNIQUE NOT NULL
first_name   TEXT NOT NULL
last_name    TEXT NOT NULL
role         TEXT NOT NULL
preferences  JSONB NOT NULL
created_at   TIMESTAMPTZ NOT NULL
updated_at   TIMESTAMPTZ NOT NULL
```

### appointments
**Appointment scheduling**
```sql
id               UUID PRIMARY KEY
tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE
patient_id       UUID REFERENCES users(id)
provider_id      UUID REFERENCES providers(id)
start_time       TIMESTAMPTZ NOT NULL
end_time         TIMESTAMPTZ NOT NULL
status           TEXT NOT NULL
appointment_type TEXT NOT NULL
location_details JSONB NOT NULL
created_at       TIMESTAMPTZ NOT NULL
updated_at       TIMESTAMPTZ NOT NULL
```

### providers
**Healthcare provider profiles**
```sql
id                    UUID PRIMARY KEY
tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id)
specialization        TEXT
license_number        TEXT
bio                   TEXT
calendar_sync_enabled BOOLEAN DEFAULT false
calendar_sync_token   TEXT
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL
```

## Migration History
- **20251111082838_InitialCleanSchema**: Clean baseline migration reflecting current unified schema

## Key Changes from Legacy
- ❌ Removed `clinics` table
- ✅ Clinic data merged into `tenants` table  
- ✅ All foreign keys updated to reference `tenants.id`
- ✅ Clean migration history established
- ✅ EF Core state synchronized with database reality

## Relationships
- `tenants` → `users` (1:many)
- `tenants` → `appointments` (1:many) 
- `tenants` → `providers` (1:many)
- `users` → `appointments` (1:many as patient)
- `providers` → `appointments` (1:many)

## Notes
- All entities are tenant-scoped for multi-tenancy
- JSONB fields store flexible configuration/metadata
- Cascade deletes ensure data integrity
- Schema matches current EF Core entity model exactly
