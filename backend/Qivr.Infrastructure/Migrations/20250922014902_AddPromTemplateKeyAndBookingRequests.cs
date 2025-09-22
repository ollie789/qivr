using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPromTemplateKeyAndBookingRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "key",
                schema: "qivr",
                table: "prom_templates",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "scoring_rules",
                schema: "qivr",
                table: "prom_templates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "version",
                schema: "qivr",
                table: "prom_templates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "prom_booking_requests",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    prom_instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    preferred_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    alternative_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    time_preference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reason_for_visit = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_booking_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_prom_booking_requests_prom_instances_prom_instance_id",
                        column: x => x.prom_instance_id,
                        principalSchema: "qivr",
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_prom_templates_tenant_id_key_version",
                schema: "qivr",
                table: "prom_templates",
                columns: new[] { "tenant_id", "key", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_prom_booking_requests_prom_instance_id",
                schema: "qivr",
                table: "prom_booking_requests",
                column: "prom_instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_booking_requests_tenant_id_prom_instance_id",
                schema: "qivr",
                table: "prom_booking_requests",
                columns: new[] { "tenant_id", "prom_instance_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "prom_booking_requests",
                schema: "qivr");

            migrationBuilder.DropIndex(
                name: "ix_prom_templates_tenant_id_key_version",
                schema: "qivr",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "key",
                schema: "qivr",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "scoring_rules",
                schema: "qivr",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "version",
                schema: "qivr",
                table: "prom_templates");
        }
    }
}
