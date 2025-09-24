# Workflow Test Guide

## Testing Strategy

### Unit Tests
```bash
# Backend
cd backend
dotnet test

# Frontend
npm test
```

### Integration Tests
```bash
cd backend
dotnet test --filter Category=Integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Test Coverage Goals
- Unit Tests: 80% coverage
- Integration Tests: Critical paths
- E2E Tests: Main user workflows

## CI/CD Pipeline
Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment

