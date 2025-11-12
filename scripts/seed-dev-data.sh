#!/bin/bash

# Seed development data for Qivr clinic dashboard
# This script temporarily enables the DataSeeder in Program.cs and runs it

set -e

echo "🌱 Seeding development data..."

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Backup current Program.cs
cp Qivr.Api/Program.cs Qivr.Api/Program.cs.backup

# Uncomment the seeder lines
sed -i.tmp 's|^    // using var scope = app.Services.CreateScope();|    using var scope = app.Services.CreateScope();|' Qivr.Api/Program.cs
sed -i.tmp 's|^    // var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();|    var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();|' Qivr.Api/Program.cs
sed -i.tmp 's|^    // var seeder = new DataSeeder(dbContext);|    var seeder = new DataSeeder(dbContext);|' Qivr.Api/Program.cs
sed -i.tmp 's|^    // await seeder.SeedAsync();|    await seeder.SeedAsync();|' Qivr.Api/Program.cs

# Clean up sed backup files
rm -f Qivr.Api/Program.cs.tmp

echo "✅ Enabled DataSeeder in Program.cs"

# Run the application briefly to trigger seeding
echo "🚀 Running application to trigger seeding..."
timeout 10s dotnet run --project Qivr.Api || true

# Restore original Program.cs
mv Qivr.Api/Program.cs.backup Qivr.Api/Program.cs

echo "✅ Restored original Program.cs"
echo "🎉 Development data seeding complete!"
