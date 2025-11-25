# Analytics Fixes - Action Plan

## 🔍 Issues Identified

### 1. Pain Map Analytics API Mismatch ⚠️
**Problem:** Frontend uses POST, backend expects GET
- Frontend: `POST /api/pain-map-analytics/heatmap`
- Backend: `GET /api/clinic-analytics/pain-maps`

**Fix:** Update frontend to use GET endpoint

### 2. Missing Error Handling ⚠️
**Problem:** No user-friendly error messages when analytics fail
**Fix:** Add error boundaries and fallback UI

### 3. Loading States Incomplete ⚠️
**Problem:** Some components show blank while loading
**Fix:** Add skeleton loaders

### 4. Health Progress Using Mock Data ⚠️
**Problem:** Patient portal Health Progress page has hardcoded data
**Fix:** Connect to `/api/patient-analytics` endpoint

## 🛠️ Fixes to Implement

### Fix 1: Update Pain Map Analytics API Call

**File:** `apps/clinic-dashboard/src/pages/Analytics.tsx`

**Current:**
```typescript
const { data: painHeatMap } = useQuery({
  queryFn: async () => {
    return await apiClient.post("/api/pain-map-analytics/heatmap", {
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      avatarType: painAvatarType,
      viewOrientation: painViewOrientation,
    });
  },
});
```

**Fixed:**
```typescript
const { data: painAnalytics } = useQuery({
  queryFn: () => {
    const { from, to } = getDateRange();
    return analyticsApi.getPainMapAnalytics(from, to);
  },
});
```

### Fix 2: Add Error Handling

**Add to Analytics.tsx:**
```typescript
if (error) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">
        Failed to load analytics data. Please try again.
        <Button onClick={refetch} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    </Box>
  );
}
```

### Fix 3: Add Loading Skeletons

**Add to Analytics.tsx:**
```typescript
if (loading) {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} md={3} key={i}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
```

### Fix 4: Connect Health Progress to Real API

**File:** `apps/patient-portal/src/pages/HealthProgress.tsx`

**Current:**
```typescript
const { data: stats } = useQuery({
  queryKey: ['health-stats'],
  queryFn: async () => {
    return {
      healthScore: 72,
      // ... mock data
    };
  }
});
```

**Fixed:**
```typescript
const { data: stats, isLoading, error } = useQuery({
  queryKey: ['health-stats'],
  queryFn: async () => {
    const response = await api.get('/api/patient-analytics');
    return {
      healthScore: calculateHealthScore(response),
      appointmentStreak: response.appointmentStreak || 0,
      promStreak: response.promStreak || 0,
      totalAppointments: response.totalAppointments || 0,
      completedProms: response.completedProms || 0,
      improvementRate: response.improvementRate || 0,
      nextMilestone: response.nextMilestone
    };
  }
});
```

### Fix 5: Standardize Date Handling

**Create utility function:**
```typescript
// apps/clinic-dashboard/src/utils/dateUtils.ts
export const getDateRangeParams = (days: number) => {
  const to = new Date();
  const from = subDays(to, days);
  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
};
```

## 📋 Implementation Checklist

### Immediate (Critical)
- [ ] Fix pain map API endpoint mismatch
- [ ] Add error handling to Analytics page
- [ ] Add loading skeletons
- [ ] Test all analytics endpoints manually

### Short-term (Important)
- [ ] Connect Health Progress to real API
- [ ] Add PatientAnalyticsService backend method for health score
- [ ] Implement retry logic for failed requests
- [ ] Add refresh button to analytics pages

### Medium-term (Enhancement)
- [ ] Add caching strategy (staleTime: 5 minutes)
- [ ] Implement background refetch
- [ ] Add analytics data export
- [ ] Create analytics dashboard tests

## 🧪 Testing Plan

### Manual Testing
1. **Clinic Dashboard Analytics**
   ```bash
   # Open browser console
   # Navigate to /analytics
   # Check for:
   - API calls to /api/clinic-analytics/dashboard
   - API calls to /api/clinic-analytics/clinical
   - Any 404 or 500 errors
   - Data rendering in stat cards
   - Charts displaying correctly
   ```

2. **Patient Portal Health Progress**
   ```bash
   # Navigate to /health-progress
   # Check for:
   - Mock data vs real API calls
   - Loading states
   - Error handling
   ```

### API Testing
```bash
# Test clinic analytics endpoints
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.qivr.pro/api/clinic-analytics/dashboard"

curl -H "Authorization: Bearer $TOKEN" \
  "https://api.qivr.pro/api/clinic-analytics/clinical?from=2025-10-25&to=2025-11-25"

curl -H "Authorization: Bearer $TOKEN" \
  "https://api.qivr.pro/api/clinic-analytics/pain-maps?from=2025-10-25&to=2025-11-25"
```

## 🚀 Deployment Plan

1. **Phase 1: Backend Verification**
   - Verify all analytics endpoints return data
   - Check database queries are optimized
   - Add logging for analytics requests

2. **Phase 2: Frontend Fixes**
   - Update pain map API calls
   - Add error handling
   - Add loading states
   - Deploy to staging

3. **Phase 3: Health Progress Integration**
   - Create health score calculation logic
   - Connect to patient analytics API
   - Add achievement tracking
   - Deploy to production

4. **Phase 4: Monitoring**
   - Monitor analytics API performance
   - Track error rates
   - Gather user feedback

## 📊 Success Metrics

- ✅ All analytics endpoints return 200 status
- ✅ No console errors on analytics pages
- ✅ Loading states show for < 2 seconds
- ✅ Error states display helpful messages
- ✅ Health Progress shows real data
- ✅ Charts render with actual metrics
- ✅ Pain map visualization works

## 🔗 Related Files

### To Modify
- `apps/clinic-dashboard/src/pages/Analytics.tsx`
- `apps/patient-portal/src/pages/HealthProgress.tsx`
- `apps/patient-portal/src/services/patientAnalyticsApi.ts`
- `backend/Qivr.Services/PatientAnalyticsService.cs`

### To Create
- `apps/clinic-dashboard/src/utils/dateUtils.ts`
- `apps/patient-portal/src/utils/healthScoreCalculator.ts`

---

**Priority:** HIGH
**Estimated Time:** 2-3 hours
**Status:** Ready to implement
