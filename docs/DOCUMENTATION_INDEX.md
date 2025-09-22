# QIVR Documentation Index

## 📚 Core Documentation Structure

### Primary Documents (Root Level)
- **README.md** - Project overview, quick start, architecture summary
- **CHANGELOG.md** - Version history and release notes  
- **LICENSE** - Licensing information

### `/docs` Directory - Technical Documentation

#### Setup & Configuration
- **LOCAL_SETUP.md** - Comprehensive local development setup guide
- **AWS_COGNITO_SETUP.md** - AWS Cognito configuration and troubleshooting
- **PORTS_CONFIG.md** - Service port configuration and management

#### Development & Operations
- **PROJECT_STATUS.md** - Current implementation status, roadmap, known issues
- **API_AUDIT_REPORT.md** - API endpoint status, testing coverage, issues
- **FEATURE_STATUS.md** - Feature implementation tracking
- **deployment.md** - Production deployment guide
- **security.md** - Security guidelines and best practices

#### Testing & Quality
- **WORKFLOW_TEST_GUIDE.md** - Testing workflows and procedures  
- **TROUBLESHOOTING.md** - Common issues and solutions

#### Migration & Updates
- **MIGRATIONS.md** - Database and code migration tracking

### `/docs/archive` Directory - Historical/Reference
- Older API audit reports
- Completed migration documents  
- Historical system reports
- Deprecated configuration files

## 🗺️ Documentation Map

| Document | Purpose | Audience | Update Frequency |
|----------|---------|----------|------------------|
| README.md | Project intro & quick start | All | As needed |
| LOCAL_SETUP.md | Dev environment setup | Developers | Major changes |
| PROJECT_STATUS.md | Implementation tracking | Team/Management | Weekly |
| API_AUDIT_REPORT.md | API health & coverage | Backend devs | Sprint end |
| FEATURE_STATUS.md | Feature progress | Product team | Sprint end |
| TROUBLESHOOTING.md | Issue resolution | Support/Dev | As issues arise |
| deployment.md | Production setup | DevOps | Major releases |
| security.md | Security practices | All developers | Quarterly |

## 📋 Consolidation Actions Completed

### ✅ Merged Documents
1. **Setup Documentation**
   - QUICK_START.md → README.md
   - SETUP.md + LOCAL_SETUP.md → docs/LOCAL_SETUP.md
   
2. **Port Configuration**  
   - PORTS.md + PORT_CONFIGURATION.md → docs/PORTS_CONFIG.md

3. **API Documentation**
   - API_AUDIT_REPORT.md + API_AUDIT_REPORT_old.md → docs/API_AUDIT_REPORT.md
   - api-endpoint-issues.md → Integrated into API_AUDIT_REPORT.md

4. **Status Reports**
   - SYSTEM_STATUS_REPORT.md → PROJECT_STATUS.md

### 🗄️ Archived Documents
- API_AUDIT_REPORT_old.md → docs/archive/
- AXIOS_TO_FETCH_MIGRATION_COMPLETE.md → docs/archive/
- AXIOS_MIGRATION_STATUS.md → docs/archive/
- fix-clinic-auth.md → Integrated into TROUBLESHOOTING.md
- WARP.md (old version) → Updated in root

## 🔍 Quick Reference

### Where to find...

**Getting started?**
→ Start with README.md, then LOCAL_SETUP.md

**API endpoint info?**
→ docs/API_AUDIT_REPORT.md and Swagger at http://localhost:5050/swagger

**Current bugs/issues?**
→ docs/PROJECT_STATUS.md (Known Issues section)

**Feature implementation status?**
→ docs/FEATURE_STATUS.md

**Port conflicts?**
→ docs/PORTS_CONFIG.md

**Authentication setup?**
→ docs/AWS_COGNITO_SETUP.md

**Deployment instructions?**
→ docs/deployment.md

**Security guidelines?**
→ docs/security.md

## 📝 Documentation Standards

### File Naming
- Use UPPERCASE for primary docs (README.md, CHANGELOG.md)
- Use lowercase for technical docs (deployment.md, security.md)
- Use underscores for multi-word files (PROJECT_STATUS.md)

### Content Structure
1. Clear heading with purpose
2. Table of contents for long documents
3. Code examples with language tags
4. Update timestamps where relevant
5. Links to related documents

### Maintenance
- Review quarterly for accuracy
- Update with each major release
- Archive obsolete documents
- Keep active documentation concise

---

*Last Updated: 2025-01-09*
*Maintainer: Development Team*