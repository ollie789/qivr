# Qivr Database Tooling

The project now uses Entity Framework Core migrations as the single source of truth for the database schema. The legacy raw SQL migration files have been removed.

## 📦 Migration location

All migrations live under `backend/Qivr.Infrastructure/Migrations`. The generated files are checked into source control.

## 🚀 Applying migrations

Run the latest migrations against your configured database:

```bash
cd backend
dotnet ef database update \
  --project Qivr.Infrastructure \
  --startup-project Qivr.Api
```

The command honours the connection string defined in `appsettings.Development.json` or the `DATABASE_URL` environment variable.

## ✍️ Creating a new migration

1. Make your model changes in the C# entity classes or `QivrDbContext`.
2. Generate a migration:

   ```bash
   cd backend
   dotnet ef migrations add <DescriptiveName> \
     --project Qivr.Infrastructure \
     --startup-project Qivr.Api
   ```
3. Review the generated files in `backend/Qivr.Infrastructure/Migrations` and commit them.

## 🌱 Seeding development data

Use the Super Admin seed endpoint while running the API locally:

```bash
curl -X POST http://localhost:5001/api/superadmin/seed-test-data
```

This seeds tenants, users, and baseline PROM templates/responses using EF Core.

## 🔍 Helpful commands

- Show pending migrations:
  ```bash
  dotnet ef migrations list --project backend/Qivr.Infrastructure --startup-project backend/Qivr.Api
  ```
- Remove the last migration (if not applied):
  ```bash
  dotnet ef migrations remove --project backend/Qivr.Infrastructure --startup-project backend/Qivr.Api
  ```

## 🛡️ Notes

- Always generate migrations from the root of the solution to ensure references resolve correctly.
- Never edit generated migration files after they have been applied to a shared environment.
- Production deployments should run `dotnet ef database update` as part of the release process.

