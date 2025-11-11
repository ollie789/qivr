# 🎯 TENANT-CLINIC MERGE ROADMAP

## **Goal**: Eliminate tenant vs clinic ID confusion by making them the same entity

---

## **PHASE 1: Foundation (Immediate - No Breaking Changes)**
- [x] **1.1** Make clinic.Id = tenant.Id in signup process ✅
- [x] **1.2** Update existing clinic records to use tenant ID as clinic ID ✅
- [ ] **1.3** Test provider creation with unified IDs
- [ ] **1.4** Deploy and verify no regressions

---

## **PHASE 2: Endpoint Simplification (Incremental)**
- [x] **2.1** Update ClinicManagementController endpoints: ✅
  - [x] `/clinics/{clinicId}/providers` → `/providers`
  - [ ] `/clinics/{clinicId}/schedule` → `/schedule`  
  - [ ] `/clinics/{clinicId}/analytics` → `/analytics`
- [ ] **2.2** Update AppointmentsController:
  - [ ] Remove clinicId parameters, use tenantId from auth
- [ ] **2.3** Update frontend API calls to use new endpoints
- [ ] **2.4** Test all affected functionality

---

## **PHASE 3: Data Model Cleanup (Safe Refactoring)**
- [ ] **3.1** Add tenant properties to replace clinic properties:
  - [ ] Tenant.ClinicName → Name
  - [ ] Tenant.ClinicEmail → Email  
  - [ ] Tenant.ClinicPhone → Phone
  - [ ] Tenant.ClinicAddress → Address
- [ ] **3.2** Migrate data from Clinic table to Tenant table
- [ ] **3.3** Update services to use Tenant instead of Clinic
- [ ] **3.4** Remove foreign key references to Clinic table

---

## **PHASE 4: Final Cleanup (Remove Redundancy)**
- [ ] **4.1** Remove Clinic entity and table
- [ ] **4.2** Update all DTOs and models
- [ ] **4.3** Clean up unused clinic-related code
- [ ] **4.4** Update documentation and API specs

---

## **ROLLBACK PLAN**
- Each phase can be rolled back independently
- Database migrations are reversible
- Old endpoints maintained until Phase 3

---

## **TESTING STRATEGY**
- [ ] Provider creation test after each phase
- [ ] Full test suite after each phase  
- [ ] Advanced features test (messages, PROMs)
- [ ] Multi-tenant isolation verification

---

## **PROGRESS TRACKER**
- **Current Phase**: 2 (Endpoint Simplification)
- **Completed**: 3/16 tasks (18.75%)
- **Next Task**: 2.1 - Complete remaining endpoint simplifications
- **Build Status**: #111 deploying Phase 1 changes

---

## **BENEFITS ACHIEVED**
- [ ] Provider creation works without ID confusion
- [ ] Simpler API endpoints (/providers vs /clinics/{id}/providers)
- [ ] Reduced technical debt
- [ ] Cleaner codebase
- [ ] Better developer experience
