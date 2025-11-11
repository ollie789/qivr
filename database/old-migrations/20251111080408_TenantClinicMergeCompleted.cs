using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TenantClinicMergeCompleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration is a no-op because the tenant-clinic merge changes
            // were already applied manually via PostgreSQL CLI:
            // 1. Added clinic properties to tenants table
            // 2. Migrated data from clinics to tenants
            // 3. Dropped clinics table
            // 4. Updated foreign key references
            
            // The EF model now matches the actual database state
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Cannot rollback - this would require recreating the clinics table
            // and migrating data back, which is not supported
            throw new NotSupportedException("Cannot rollback tenant-clinic merge - changes were applied manually");
        }
    }
}
