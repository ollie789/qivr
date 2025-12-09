using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure._deprecated_ef_migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_treatment_plans__users_patient_id",
                table: "treatment_plans");

            migrationBuilder.AddColumn<string>(
                name: "Consent",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "date_of_birth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "email_verified",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "gender",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "last_login_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "phone_verified",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string[]>(
                name: "roles",
                table: "users",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "patient_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "body_region",
                table: "treatment_plans",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "condition_type",
                table: "treatment_plans",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_template",
                table: "treatment_plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "source_template_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "template_source",
                table: "treatment_plans",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "times_used",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Settings",
                table: "tenants",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AddColumn<string>(
                name: "Metadata",
                table: "tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locale",
                table: "tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "plan",
                table: "tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "timezone",
                table: "tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "correlation_id",
                table: "document_audit_log",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "service_type_id",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "patient_invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    evaluation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resend_count = table.Column<int>(type: "integer", nullable: false),
                    last_reminder_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    personal_message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patient_invitations", x => x.id);
                    table.ForeignKey(
                        name: "FK_patient_invitations_users_created_by",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_patient_invitations__users_user_id1",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_patient_invitations_evaluations_evaluation_id",
                        column: x => x.evaluation_id,
                        principalTable: "evaluations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "service_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    specialty = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    billing_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_types", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_types__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "treatment_progress_feedbacks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    prom_instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    treatment_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    overall_effectiveness_rating = table.Column<int>(type: "integer", nullable: true),
                    pain_compared_to_start = table.Column<int>(type: "integer", nullable: true),
                    exercise_compliance = table.Column<int>(type: "integer", nullable: true),
                    sessions_completed_this_week = table.Column<int>(type: "integer", nullable: true),
                    helpful_exercise_ids = table.Column<List<Guid>>(type: "uuid[]", nullable: true),
                    problematic_exercise_ids = table.Column<List<Guid>>(type: "uuid[]", nullable: true),
                    exercise_comments = table.Column<string>(type: "text", nullable: true),
                    barriers = table.Column<List<string>>(type: "text[]", nullable: true),
                    suggestions = table.Column<string>(type: "text", nullable: true),
                    wants_clinician_discussion = table.Column<bool>(type: "boolean", nullable: true),
                    current_phase_number = table.Column<int>(type: "integer", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treatment_progress_feedbacks", x => x.id);
                    table.ForeignKey(
                        name: "fk_treatment_progress_feedbacks__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_treatment_progress_feedbacks_prom_instances_prom_instance_id",
                        column: x => x.prom_instance_id,
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_treatment_progress_feedbacks_treatment_plans_treatment_plan~",
                        column: x => x.treatment_plan_id,
                        principalTable: "treatment_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_service_type_id",
                table: "appointments",
                column: "service_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_invitations_created_by",
                table: "patient_invitations",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_patient_invitations_evaluation_id",
                table: "patient_invitations",
                column: "evaluation_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_invitations_tenant_id_email",
                table: "patient_invitations",
                columns: new[] { "tenant_id", "email" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_invitations_tenant_id_status",
                table: "patient_invitations",
                columns: new[] { "tenant_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_invitations_tenant_id_user_id",
                table: "patient_invitations",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_patient_invitations_token",
                table: "patient_invitations",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_patient_invitations_user_id",
                table: "patient_invitations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_types_tenant_id_specialty_name",
                table: "service_types",
                columns: new[] { "tenant_id", "specialty", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_treatment_progress_feedbacks_patient_id",
                table: "treatment_progress_feedbacks",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_progress_feedbacks_prom_instance_id",
                table: "treatment_progress_feedbacks",
                column: "prom_instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_progress_feedbacks_treatment_plan_id",
                table: "treatment_progress_feedbacks",
                column: "treatment_plan_id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__service_types_service_type_id",
                table: "appointments",
                column: "service_type_id",
                principalTable: "service_types",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_treatment_plans__users_patient_id",
                table: "treatment_plans",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments__service_types_service_type_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_treatment_plans__users_patient_id",
                table: "treatment_plans");

            migrationBuilder.DropTable(
                name: "patient_invitations");

            migrationBuilder.DropTable(
                name: "service_types");

            migrationBuilder.DropTable(
                name: "treatment_progress_feedbacks");

            migrationBuilder.DropIndex(
                name: "ix_appointments_service_type_id",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "Consent",
                table: "users");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "users");

            migrationBuilder.DropColumn(
                name: "date_of_birth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "email_verified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "gender",
                table: "users");

            migrationBuilder.DropColumn(
                name: "last_login_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "phone_verified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "roles",
                table: "users");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "users");

            migrationBuilder.DropColumn(
                name: "body_region",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "condition_type",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "is_template",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "source_template_id",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "template_source",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "times_used",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "Metadata",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "locale",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "plan",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "status",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "timezone",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "correlation_id",
                table: "document_audit_log");

            migrationBuilder.DropColumn(
                name: "service_type_id",
                table: "appointments");

            migrationBuilder.AlterColumn<Guid>(
                name: "patient_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Settings",
                table: "tenants",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddForeignKey(
                name: "fk_treatment_plans__users_patient_id",
                table: "treatment_plans",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
