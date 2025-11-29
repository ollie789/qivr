using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Qivr.Core.Entities;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTreatmentPlanIdToAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "chief_complaint",
                table: "evaluations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "medical_record_id",
                table: "evaluations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "treatment_plan_id",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "api_keys",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    key_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    key_prefix = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    last_used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    scopes = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_api_keys", x => x.id);
                    table.ForeignKey(
                        name: "fk_api_keys__users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "treatment_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    diagnosis = table.Column<string>(type: "text", nullable: true),
                    goals = table.Column<string>(type: "text", nullable: true),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_weeks = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    Sessions = table.Column<List<TreatmentSession>>(type: "jsonb", nullable: false),
                    Exercises = table.Column<List<Exercise>>(type: "jsonb", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    review_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treatment_plans", x => x.id);
                    table.ForeignKey(
                        name: "fk_treatment_plans__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_treatment_plans__users_provider_id",
                        column: x => x.provider_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_treatment_plan_id",
                table: "appointments",
                column: "treatment_plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_api_keys_creator_id",
                table: "api_keys",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_plans_patient_id",
                table: "treatment_plans",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_plans_provider_id",
                table: "treatment_plans",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "IX_treatment_plans_tenant_id_patient_id",
                table: "treatment_plans",
                columns: new[] { "tenant_id", "patient_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__treatment_plans_treatment_plan_id",
                table: "appointments",
                column: "treatment_plan_id",
                principalTable: "treatment_plans",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments__treatment_plans_treatment_plan_id",
                table: "appointments");

            migrationBuilder.DropTable(
                name: "api_keys");

            migrationBuilder.DropTable(
                name: "treatment_plans");

            migrationBuilder.DropIndex(
                name: "ix_appointments_treatment_plan_id",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "medical_record_id",
                table: "evaluations");

            migrationBuilder.DropColumn(
                name: "treatment_plan_id",
                table: "appointments");

            migrationBuilder.AlterColumn<string>(
                name: "chief_complaint",
                table: "evaluations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);
        }
    }
}
