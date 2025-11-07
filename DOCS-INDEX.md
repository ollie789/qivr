# QIVR Documentation Index

**Last Updated:** November 7, 2025

---

## 📚 Essential Documentation

### Getting Started
- **[README.md](README.md)** - Project overview, quick start, local development

### Operations
- **[OPERATIONS.md](OPERATIONS.md)** - Deployment, monitoring, troubleshooting, common commands
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick command reference card

### Current Status
- **[SYSTEM-AUDIT-2025-11-06.md](SYSTEM-AUDIT-2025-11-06.md)** - System audit and status
- **[TODO-FRESH.md](TODO-FRESH.md)** - Current action items and priorities

---

## 🏗️ Infrastructure Documentation

Located in `infrastructure/`:

- **[infrastructure/README.md](infrastructure/README.md)** - Infrastructure overview
- **[infrastructure/STAGING-IMPROVEMENTS-GUIDE.md](infrastructure/STAGING-IMPROVEMENTS-GUIDE.md)** - Manual setup guide
- **[infrastructure/OTEL-QUICK-REFERENCE.md](infrastructure/OTEL-QUICK-REFERENCE.md)** - OpenTelemetry configuration

---

## 📂 Documentation Structure

```
qivr/
├── README.md                          # Main project readme
├── OPERATIONS.md                      # Operations guide
├── QUICK-REFERENCE.md                 # Command reference
├── SYSTEM-AUDIT-2025-11-06.md        # System audit
├── TODO-FRESH.md                      # Current TODO list
├── DOCS-INDEX.md                      # This file
├── infrastructure/
│   ├── README.md                      # Infrastructure overview
│   ├── STAGING-IMPROVEMENTS-GUIDE.md  # Setup guide
│   └── OTEL-QUICK-REFERENCE.md       # OpenTelemetry docs
└── docs/
    ├── archive/                       # Historical documents
    └── [other technical docs]
```

---

## 🎯 Which Doc Should I Read?

**I want to...**

- **Get started locally** → [README.md](README.md)
- **Deploy to production** → [OPERATIONS.md](OPERATIONS.md)
- **See what needs to be done** → [TODO-FRESH.md](TODO-FRESH.md)
- **Understand the system** → [SYSTEM-AUDIT-2025-11-06.md](SYSTEM-AUDIT-2025-11-06.md)
- **Find a specific command** → [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- **Set up infrastructure** → [infrastructure/STAGING-IMPROVEMENTS-GUIDE.md](infrastructure/STAGING-IMPROVEMENTS-GUIDE.md)

---

## 📝 Documentation Principles

1. **Keep it current** - Update docs when making changes
2. **Keep it concise** - No redundant information
3. **Keep it actionable** - Focus on what to do, not history
4. **Archive old docs** - Move outdated docs to `docs/archive/`

---

## 🗑️ Recently Cleaned Up

Removed 25+ redundant documentation files on November 7, 2025:
- Multiple TODO files consolidated into TODO-FRESH.md
- Multiple deployment summaries consolidated into OPERATIONS.md
- Multiple feature docs consolidated into SYSTEM-AUDIT
- Historical fixes moved to archive

---

**Questions?** Contact oliver@qivr.io
