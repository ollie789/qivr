#!/bin/bash
echo "🔄 Applying Database Migrations..."
echo "=================================="
echo ""
echo "Migrations to apply:"
echo "  1. 20251119021937_AddPainAssessmentsAndVitalSigns"
echo "  2. 20251119044638_AddMessageCategoryAndContext"
echo ""

# Run migrations
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api --verbose

echo ""
echo "✅ Migrations applied!"
echo ""
echo "Verifying migrations..."
dotnet ef migrations list --project Qivr.Infrastructure --startup-project Qivr.Api
