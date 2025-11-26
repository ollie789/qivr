# Quick Test Checklist - Patient Flow

**⏱️ Time Required:** 10-15 minutes  
**Environment:** Production

---

## 🚀 Quick Smoke Test (5 minutes)

### Clinic Dashboard (https://clinic.qivr.pro)

- [ ] **Intake Management** - Can see intake kanban board
- [ ] **Medical Records** - Can view patient list and details
- [ ] **Appointments** - Calendar view loads, can see appointments
- [ ] **Timeline** - Shows comprehensive patient history
- [ ] **Session Notes** - Dialog has modalities, pain slider, PROM checkbox

### Patient Portal (https://patient.qivr.pro)

- [ ] **Dashboard** - Treatment Plan Card displays (purple gradient)
- [ ] **PROM** - Shows 3D pain map comparison (baseline vs current)
- [ ] **Rebooking** - Dialog appears after PROM with available slots
- [ ] **Notifications** - Bell icon shows notifications

---

## 🔍 Critical Path Test (10 minutes)

### Flow: Intake → Medical Record → Treatment Plan → Appointment

1. **Submit Intake** (Patient Portal)
   - [ ] Form submits successfully
   
2. **Create Medical Record** (Clinic Dashboard)
   - [ ] Click "Create Record & Plan" on intake
   - [ ] Form pre-fills with intake data
   - [ ] Treatment Plan Dialog opens after creation
   
3. **Create Treatment Plan** (Clinic Dashboard)
   - [ ] Fill goals, frequency, duration
   - [ ] Schedule Appointment Dialog opens after creation
   
4. **Schedule Appointment** (Clinic Dashboard)
   - [ ] Appointment created and visible in calendar

5. **View Treatment Plan** (Patient Portal)
   - [ ] Purple card shows on dashboard
   - [ ] Goals, schedule, progress visible

6. **Complete PROM** (Patient Portal)
   - [ ] Pain map comparison works
   - [ ] Rebooking dialog appears

7. **View Timeline** (Clinic Dashboard)
   - [ ] All events show (appointments, PROMs, plans)

8. **Session Notes** (Clinic Dashboard)
   - [ ] Modalities checkboxes work
   - [ ] Pain slider works
   - [ ] Notes save correctly

---

## 🐛 Known Issues to Check

- [ ] Grid components use `size` prop (not `item`)
- [ ] Timeline shows timestamps with time
- [ ] Pain progression chart displays side-by-side
- [ ] Appointment links (person icon, treatment icon) work
- [ ] PROM improvement percentage calculates

---

## ✅ Pass Criteria

- All critical path steps complete without errors
- No console errors in browser
- Data persists correctly
- UI is responsive and loads quickly

---

**Tested:** ___________  
**Result:** ✅ Pass / ❌ Fail  
**Notes:** ___________
