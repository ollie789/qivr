using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentWaitlistEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "appointment_waitlist_entries",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: true),
                    appointment_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    preferred_dates = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: false),
                    fulfilled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    matched_appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointment_waitlist_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_waitlist_entries_appointments_matched_appointment_id",
                        column: x => x.matched_appointment_id,
                        principalSchema: "qivr",
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_waitlist_entries_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_waitlist_entries_users_provider_id",
                        column: x => x.provider_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_matched_appointment_id",
                schema: "qivr",
                table: "appointment_waitlist_entries",
                column: "matched_appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_patient_id",
                schema: "qivr",
                table: "appointment_waitlist_entries",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_provider_id",
                schema: "qivr",
                table: "appointment_waitlist_entries",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_tenant_status",
                schema: "qivr",
                table: "appointment_waitlist_entries",
                columns: new[] { "tenant_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_tenant_patient_status",
                schema: "qivr",
                table: "appointment_waitlist_entries",
                columns: new[] { "tenant_id", "patient_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointment_waitlist_entries",
                schema: "qivr");
        }
    }
}
