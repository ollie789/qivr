# Sprint 2 Planning

**Date:** 2025-11-10
**Status:** Ready to Start

## Sprint 1 Recap - COMPLETED ✅

### Major Achievements:
1. ✅ Fixed clinic registration (CloudFront routing, API deployment)
2. ✅ Cleaned up project structure (60+ files organized)
3. ✅ Consolidated SaaS tenant services
4. ✅ Fixed build pipeline (Docker, compilation errors)
5. ✅ Documented architecture (tenancy, config, structure)

### Current Deployment:
- Build #39 deploying now (latest fixes)
- CloudFront configured with /api/* routing
- SaaS multi-tenancy working
- Frontend deployed to S3

## Sprint 2 Goals

### Theme: **Stability & User Experience**

Focus on making the app production-ready and improving the user journey.

---

## Proposed Features

### 🔥 HIGH PRIORITY

#### 1. Complete Clinic Registration Flow
**Goal:** User can register clinic and immediately start using it

**Tasks:**
- [ ] Test end-to-end registration (create clinic → Cognito pool → login)
- [ ] Add loading states and error messages
- [ ] Handle registration failures gracefully
- [ ] Auto-login after successful registration
- [ ] Redirect to dashboard after login

**Acceptance Criteria:**
- User can register clinic without errors
- User is automatically logged into their new clinic
- Clear error messages if something fails

---

#### 2. User Authentication & Session Management
**Goal:** Secure, seamless authentication experience

**Tasks:**
- [ ] Implement token refresh logic
- [ ] Add "Remember me" functionality
- [ ] Handle session expiration gracefully
- [ ] Add logout functionality
- [ ] Persist tenant selection across sessions

**Acceptance Criteria:**
- Users stay logged in across browser refreshes
- Token refresh happens automatically
- Clear feedback when session expires

---

#### 3. Dashboard Data & Metrics
**Goal:** Show meaningful data on dashboard

**Tasks:**
- [ ] Connect dashboard widgets to real API data
- [ ] Add patient count metrics
- [ ] Add appointment statistics
- [ ] Add recent activity feed
- [ ] Handle empty states (no data yet)

**Acceptance Criteria:**
- Dashboard shows real data from backend
- Empty states guide users to add data
- Metrics update in real-time

---

### 🟡 MEDIUM PRIORITY

#### 4. Patient Management
**Goal:** Basic CRUD for patients

**Tasks:**
- [ ] Create patient form
- [ ] List patients with search/filter
- [ ] View patient details
- [ ] Edit patient information
- [ ] Archive/delete patients

**Acceptance Criteria:**
- Clinic admin can add/edit/view patients
- Patient list is searchable
- Data persists correctly

---

#### 5. Appointment Scheduling
**Goal:** Book and manage appointments

**Tasks:**
- [ ] Create appointment form
- [ ] Calendar view for appointments
- [ ] List view with filters
- [ ] Edit/cancel appointments
- [ ] Send appointment confirmations

**Acceptance Criteria:**
- Users can book appointments
- Calendar shows all appointments
- Appointment status updates work

---

#### 6. Error Handling & Monitoring
**Goal:** Catch and fix issues proactively

**Tasks:**
- [ ] Add CloudWatch alarms (ECS, ALB, API errors)
- [ ] Implement frontend error boundary
- [ ] Add Sentry or error tracking
- [ ] Create error logging dashboard
- [ ] Set up alerts for critical errors

**Acceptance Criteria:**
- Team is notified of production errors
- Error logs are searchable
- Users see friendly error messages

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 7. Multi-Tenant Switching
**Goal:** Users with multiple clinics can switch between them

**Tasks:**
- [ ] Add tenant switcher UI
- [ ] Persist selected tenant
- [ ] Update API calls with tenant context
- [ ] Test cross-tenant isolation

---

#### 8. User Profile & Settings
**Goal:** Users can manage their profile

**Tasks:**
- [ ] Profile page (name, email, photo)
- [ ] Change password
- [ ] Notification preferences
- [ ] Timezone settings

---

#### 9. Code Quality Improvements
**Goal:** Maintainable, tested codebase

**Tasks:**
- [ ] Fix C# nullability warnings (58 warnings)
- [ ] Add unit tests for critical paths
- [ ] Add integration tests for API
- [ ] Set up code coverage reporting
- [ ] Add pre-commit hooks (linting, formatting)

---

## Sprint Capacity

**Duration:** 2 weeks
**Team Size:** 1 developer (you)

**Recommended Focus:**
- Week 1: High Priority items 1-3
- Week 2: Medium Priority items 4-5

---

## Success Metrics

### Sprint 2 Goals:
1. ✅ Clinic registration works end-to-end
2. ✅ Users can log in and stay logged in
3. ✅ Dashboard shows real data
4. ✅ Basic patient management works
5. ✅ Appointments can be created and viewed

### Technical Debt Addressed:
- Error handling improved
- Monitoring in place
- Code quality improved

---

## Questions to Answer Before Starting

1. **What's the most important user flow to fix first?**
   - Clinic registration → Login → Dashboard?
   - Or Patient management?

2. **Do we need appointment scheduling in Sprint 2?**
   - Or focus on getting registration + patients solid first?

3. **What data should the dashboard show?**
   - Patient count, appointment count, recent activity?

4. **Do we need multi-tenant switching now?**
   - Or can we defer to Sprint 3?

---

## Next Steps

1. Review this plan
2. Prioritize features
3. Break down tasks into smaller chunks
4. Start with highest priority item
5. Deploy frequently (after each feature)

---

## Notes

- Build #39 deploying with all Sprint 1 fixes
- CloudFront propagation may take 5-10 minutes
- Test clinic registration once deployment completes
- Document any issues found during testing

