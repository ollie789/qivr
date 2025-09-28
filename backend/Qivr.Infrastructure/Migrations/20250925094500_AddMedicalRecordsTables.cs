using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalRecordsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "medical_conditions",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    condition = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    icd10_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    diagnosed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    managed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    last_reviewed = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_conditions", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_conditions_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medical_vitals",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    systolic = table.Column<int>(type: "integer", nullable: false),
                    diastolic = table.Column<int>(type: "integer", nullable: false),
                    heart_rate = table.Column<int>(type: "integer", nullable: false),
                    temperature_celsius = table.Column<decimal>(type: "numeric", nullable: false),
                    weight_kilograms = table.Column<decimal>(type: "numeric", nullable: false),
                    height_centimetres = table.Column<decimal>(type: "numeric", nullable: false),
                    oxygen_saturation = table.Column<int>(type: "integer", nullable: false),
                    respiratory_rate = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_vitals", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_vitals_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medical_lab_results",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    result_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    category = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    test_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    value = table.Column<string>(type: "text", nullable: false),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reference_range = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ordered_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_lab_results", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_lab_results_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medical_medications",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dosage = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    frequency = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    prescribed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    instructions = table.Column<string>(type: "text", nullable: true),
                    refills_remaining = table.Column<int>(type: "integer", nullable: true),
                    last_filled = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    pharmacy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_medications", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_medications_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medical_allergies",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allergen = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reaction = table.Column<string>(type: "text", nullable: false),
                    diagnosed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_allergies", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_allergies_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "medical_immunizations",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vaccine = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    next_due = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    facility = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    lot_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    series = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_immunizations", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_immunizations_users_patient_id",
                        column: x => x.patient_id,
                        principalSchema: "qivr",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_medical_conditions_tenant_patient_condition",
                schema: "qivr",
                table: "medical_conditions",
                columns: new[] { "tenant_id", "patient_id", "condition" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_vitals_tenant_patient_recorded",
                schema: "qivr",
                table: "medical_vitals",
                columns: new[] { "tenant_id", "patient_id", "recorded_at" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_lab_results_tenant_patient_category_date",
                schema: "qivr",
                table: "medical_lab_results",
                columns: new[] { "tenant_id", "patient_id", "category", "result_date" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_medications_tenant_patient_status",
                schema: "qivr",
                table: "medical_medications",
                columns: new[] { "tenant_id", "patient_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_allergies_tenant_patient_allergen",
                schema: "qivr",
                table: "medical_allergies",
                columns: new[] { "tenant_id", "patient_id", "allergen" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_immunizations_tenant_patient_date",
                schema: "qivr",
                table: "medical_immunizations",
                columns: new[] { "tenant_id", "patient_id", "date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "medical_allergies",
                schema: "qivr");

            migrationBuilder.DropTable(
                name: "medical_conditions",
                schema: "qivr");

            migrationBuilder.DropTable(
                name: "medical_immunizations",
                schema: "qivr");

            migrationBuilder.DropTable(
                name: "medical_lab_results",
                schema: "qivr");

            migrationBuilder.DropTable(
                name: "medical_medications",
                schema: "qivr");

            migrationBuilder.DropTable(
                name: "medical_vitals",
                schema: "qivr");
        }
    }
}
