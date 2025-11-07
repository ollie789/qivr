using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIntakeDedupeTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE qivr.intake_dedupe (
                    message_id TEXT PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS qivr.intake_dedupe;");
        }
    }
}
