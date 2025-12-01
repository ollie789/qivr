using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddResearchPartnerEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "research_partners",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contact_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    logo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    website = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    cognito_user_pool_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_research_partners", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_devices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    device_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    body_region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    udi_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_devices", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_devices__research_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "research_partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "partner_clinic_affiliations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    data_sharing_level = table.Column<string>(type: "text", nullable: false),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_partner_clinic_affiliations", x => x.id);
                    table.ForeignKey(
                        name: "fk_partner_clinic_affiliations__research_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "research_partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_partner_clinic_affiliations__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_partner_clinic_affiliations__users_approved_by_user_id",
                        column: x => x.approved_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "research_studies",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    protocol_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InclusionCriteria = table.Column<string>(type: "jsonb", nullable: true),
                    ExclusionCriteria = table.Column<string>(type: "jsonb", nullable: true),
                    target_enrollment = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_research_studies", x => x.id);
                    table.ForeignKey(
                        name: "fk_research_studies_research_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "research_partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patient_device_usages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    treatment_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    procedure_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    procedure_type = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    implant_location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    recorded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patient_device_usages", x => x.id);
                    table.ForeignKey(
                        name: "fk_patient_device_usages__treatment_plans_treatment_plan_id",
                        column: x => x.treatment_plan_id,
                        principalTable: "treatment_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_patient_device_usages__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_patient_device_usages__users_recorded_by_user_id",
                        column: x => x.recorded_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_patient_device_usages_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_patient_device_usages_medical_devices_device_id",
                        column: x => x.device_id,
                        principalTable: "medical_devices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "study_enrollments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    study_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    enrolled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    withdrawn_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    consent_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    baseline_completed = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_study_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "fk_study_enrollments__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_study_enrollments_research_studies_study_id",
                        column: x => x.study_id,
                        principalTable: "research_studies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_medical_devices_body_region",
                table: "medical_devices",
                column: "body_region");

            migrationBuilder.CreateIndex(
                name: "IX_medical_devices_category",
                table: "medical_devices",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_medical_devices_partner_id",
                table: "medical_devices",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_medical_devices_partner_id_device_code",
                table: "medical_devices",
                columns: new[] { "partner_id", "device_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_partner_clinic_affiliations_approved_by",
                table: "partner_clinic_affiliations",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_partner_clinic_affiliations_partner_id_tenant_id",
                table: "partner_clinic_affiliations",
                columns: new[] { "partner_id", "tenant_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_partner_clinic_affiliations_status",
                table: "partner_clinic_affiliations",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_partner_clinic_affiliations_tenant_id",
                table: "partner_clinic_affiliations",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_device_usages_appointment_id",
                table: "patient_device_usages",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_device_usages_device_id",
                table: "patient_device_usages",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_device_usages_patient_id",
                table: "patient_device_usages",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_device_usages_procedure_date",
                table: "patient_device_usages",
                column: "procedure_date");

            migrationBuilder.CreateIndex(
                name: "IX_patient_device_usages_recorded_by",
                table: "patient_device_usages",
                column: "recorded_by");

            migrationBuilder.CreateIndex(
                name: "IX_patient_device_usages_tenant_id_device_id_procedure_date",
                table: "patient_device_usages",
                columns: new[] { "tenant_id", "device_id", "procedure_date" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_device_usages_tenant_id_patient_id",
                table: "patient_device_usages",
                columns: new[] { "tenant_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_patient_device_usages_treatment_plan_id",
                table: "patient_device_usages",
                column: "treatment_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_research_partners_name",
                table: "research_partners",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_research_partners_slug",
                table: "research_partners",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_research_studies_partner_id",
                table: "research_studies",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_research_studies_protocol_id",
                table: "research_studies",
                column: "protocol_id");

            migrationBuilder.CreateIndex(
                name: "IX_research_studies_status",
                table: "research_studies",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_study_enrollments_patient_id",
                table: "study_enrollments",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_study_enrollments_status",
                table: "study_enrollments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_study_enrollments_study_id_patient_id",
                table: "study_enrollments",
                columns: new[] { "study_id", "patient_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_study_enrollments_tenant_id_patient_id",
                table: "study_enrollments",
                columns: new[] { "tenant_id", "patient_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "partner_clinic_affiliations");

            migrationBuilder.DropTable(
                name: "patient_device_usages");

            migrationBuilder.DropTable(
                name: "study_enrollments");

            migrationBuilder.DropTable(
                name: "medical_devices");

            migrationBuilder.DropTable(
                name: "research_studies");

            migrationBuilder.DropTable(
                name: "research_partners");
        }
    }
}
