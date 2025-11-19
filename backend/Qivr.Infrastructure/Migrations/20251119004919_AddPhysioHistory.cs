using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysioHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries_appointments_matched_appointme",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries_users_patient_id",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries_users_provider_id",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_evaluations_evaluation_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_providers_provider_profile_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_tenants_tenant_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_users_cancelled_by",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_users_patient_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_users_provider_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_brand_themes_tenants_tenant_id",
                table: "brand_themes");

            migrationBuilder.DropForeignKey(
                name: "fk_conversations_users_patient_id",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "fk_conversations_users_provider_id",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "fk_document_audit_logs_users_user_id",
                table: "document_audit_log");

            migrationBuilder.DropForeignKey(
                name: "fk_documents_users_assigned_to_user_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_documents_users_patient_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_documents_users_uploaded_by_user_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations_providers_provider_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations_tenants_tenant_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations_users_patient_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations_users_reviewed_by",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_providers_provider_profile_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_users_recipient_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_users_sender_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_notification_preferences_users_user_id",
                table: "notification_preferences");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications_users_recipient_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications_users_sender_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "fk_pain_coordinates_pain_maps_pain_map_id",
                table: "pain_coordinates");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_booking_requests_prom_instances_prom_instance_id",
                table: "prom_booking_requests");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_instances_prom_templates_template_id",
                table: "prom_instances");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_instances_users_patient_id",
                table: "prom_instances");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_responses_users_patient_id",
                table: "prom_responses");

            migrationBuilder.DropForeignKey(
                name: "fk_providers_users_user_id",
                table: "providers");

            migrationBuilder.DropPrimaryKey(
                name: "pk_pain_coordinates",
                table: "pain_coordinates");

            migrationBuilder.RenameIndex(
                name: "ix_users_tenant_id_email",
                table: "users",
                newName: "IX_users_tenant_id_email");

            migrationBuilder.RenameIndex(
                name: "ix_users_cognito_sub",
                table: "users",
                newName: "IX_users_cognito_id");

            migrationBuilder.RenameIndex(
                name: "ix_user_roles_tenant_id_user_id_role_id",
                table: "user_roles",
                newName: "IX_user_roles_tenant_id_user_id_role_id");

            migrationBuilder.RenameColumn(
                name: "settings",
                table: "tenants",
                newName: "Settings");

            migrationBuilder.RenameIndex(
                name: "ix_tenants_slug",
                table: "tenants",
                newName: "IX_tenants_slug");

            migrationBuilder.RenameIndex(
                name: "ix_roles_tenant_id_name",
                table: "roles",
                newName: "IX_roles_tenant_id_name");

            migrationBuilder.RenameIndex(
                name: "ix_role_permissions_role_id_permission_id",
                table: "role_permissions",
                newName: "IX_role_permissions_role_id_permission_id");

            migrationBuilder.RenameIndex(
                name: "ix_providers_tenant_id_user_id",
                table: "providers",
                newName: "IX_providers_tenant_id_user_id");

            migrationBuilder.RenameColumn(
                name: "questions",
                table: "prom_templates",
                newName: "Questions");

            migrationBuilder.RenameColumn(
                name: "scoring_method",
                table: "prom_templates",
                newName: "ScoringMethod");

            migrationBuilder.RenameIndex(
                name: "ix_prom_templates_tenant_id_name",
                table: "prom_templates",
                newName: "IX_prom_templates_tenant_id_name");

            migrationBuilder.RenameIndex(
                name: "ix_prom_templates_tenant_id_key_version",
                table: "prom_templates",
                newName: "IX_prom_templates_tenant_id_key_version");

            migrationBuilder.RenameColumn(
                name: "answers",
                table: "prom_responses",
                newName: "Answers");

            migrationBuilder.RenameIndex(
                name: "ix_prom_responses_tenant_id_patient_id_completed_at",
                table: "prom_responses",
                newName: "IX_prom_responses_tenant_id_patient_id_completed_at");

            migrationBuilder.RenameColumn(
                name: "response_data",
                table: "prom_instances",
                newName: "ResponseData");

            migrationBuilder.RenameIndex(
                name: "ix_prom_instances_tenant_id_patient_id",
                table: "prom_instances",
                newName: "IX_prom_instances_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "ix_prom_booking_requests_tenant_id_prom_instance_id",
                table: "prom_booking_requests",
                newName: "IX_prom_booking_requests_tenant_id_prom_instance_id");

            migrationBuilder.RenameIndex(
                name: "ix_permissions_key",
                table: "permissions",
                newName: "IX_permissions_key");

            migrationBuilder.RenameColumn(
                name: "pain_map_id",
                table: "pain_coordinates",
                newName: "PainMapId");

            migrationBuilder.RenameColumn(
                name: "data",
                table: "notifications",
                newName: "Data");

            migrationBuilder.RenameIndex(
                name: "ix_notifications_tenant_id_recipient_id_created_at",
                table: "notifications",
                newName: "IX_notifications_tenant_id_recipient_id_created_at");

            migrationBuilder.RenameIndex(
                name: "ix_notification_preferences_tenant_id_user_id",
                table: "notification_preferences",
                newName: "IX_notification_preferences_tenant_id_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_messages_sender_id_direct_recipient_id",
                table: "messages",
                newName: "IX_messages_sender_id_direct_recipient_id");

            migrationBuilder.RenameIndex(
                name: "ix_messages_direct_recipient_id",
                table: "messages",
                newName: "IX_messages_direct_recipient_id");

            migrationBuilder.RenameIndex(
                name: "ix_messages_conversation_id_sent_at",
                table: "messages",
                newName: "IX_messages_conversation_id_sent_at");

            migrationBuilder.RenameIndex(
                name: "ix_medical_vitals_tenant_id_patient_id_recorded_at",
                table: "medical_vitals",
                newName: "IX_medical_vitals_tenant_id_patient_id_recorded_at");

            migrationBuilder.RenameIndex(
                name: "ix_medical_procedures_tenant_id_patient_id_procedure_date",
                table: "medical_procedures",
                newName: "IX_medical_procedures_tenant_id_patient_id_procedure_date");

            migrationBuilder.RenameIndex(
                name: "ix_medical_medications_tenant_id_patient_id_status",
                table: "medical_medications",
                newName: "IX_medical_medications_tenant_id_patient_id_status");

            migrationBuilder.RenameIndex(
                name: "ix_medical_lab_results_tenant_id_patient_id_category_result_da",
                table: "medical_lab_results",
                newName: "IX_medical_lab_results_tenant_id_patient_id_category_result_da~");

            migrationBuilder.RenameIndex(
                name: "ix_medical_immunizations_tenant_id_patient_id_date",
                table: "medical_immunizations",
                newName: "IX_medical_immunizations_tenant_id_patient_id_date");

            migrationBuilder.RenameColumn(
                name: "icd10code",
                table: "medical_conditions",
                newName: "icd10_code");

            migrationBuilder.RenameIndex(
                name: "ix_medical_conditions_tenant_id_patient_id_condition",
                table: "medical_conditions",
                newName: "IX_medical_conditions_tenant_id_patient_id_condition");

            migrationBuilder.RenameIndex(
                name: "ix_medical_allergies_tenant_id_patient_id_allergen",
                table: "medical_allergies",
                newName: "IX_medical_allergies_tenant_id_patient_id_allergen");

            migrationBuilder.RenameColumn(
                name: "questionnaire_responses",
                table: "evaluations",
                newName: "QuestionnaireResponses");

            migrationBuilder.RenameColumn(
                name: "medical_history",
                table: "evaluations",
                newName: "MedicalHistory");

            migrationBuilder.RenameIndex(
                name: "ix_evaluations_tenant_id_evaluation_number",
                table: "evaluations",
                newName: "IX_evaluations_tenant_id_evaluation_number");

            migrationBuilder.RenameIndex(
                name: "ix_evaluations_reviewed_by",
                table: "evaluations",
                newName: "IX_evaluations_reviewed_by");

            migrationBuilder.RenameIndex(
                name: "ix_evaluations_patient_id",
                table: "evaluations",
                newName: "IX_evaluations_patient_id");

            migrationBuilder.RenameColumn(
                name: "s3key",
                table: "documents",
                newName: "s3_key");

            migrationBuilder.RenameColumn(
                name: "s3bucket",
                table: "documents",
                newName: "s3_bucket");

            migrationBuilder.RenameColumn(
                name: "extracted_identifiers",
                table: "documents",
                newName: "ExtractedIdentifiers");

            migrationBuilder.RenameIndex(
                name: "ix_documents_uploaded_by",
                table: "documents",
                newName: "IX_documents_uploaded_by");

            migrationBuilder.RenameIndex(
                name: "ix_documents_tenant_id_patient_id",
                table: "documents",
                newName: "IX_documents_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "ix_documents_assigned_to",
                table: "documents",
                newName: "IX_documents_assigned_to");

            migrationBuilder.RenameColumn(
                name: "metadata",
                table: "document_audit_log",
                newName: "Metadata");

            migrationBuilder.RenameIndex(
                name: "ix_conversations_tenant_id_patient_id",
                table: "conversations",
                newName: "IX_conversations_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "ix_conversation_participants_conversation_id_user_id",
                table: "conversation_participants",
                newName: "IX_conversation_participants_conversation_id_user_id");

            migrationBuilder.RenameColumn(
                name: "typography",
                table: "brand_themes",
                newName: "Typography");

            migrationBuilder.RenameColumn(
                name: "widget_config",
                table: "brand_themes",
                newName: "WidgetConfig");

            migrationBuilder.RenameIndex(
                name: "ix_brand_themes_tenant_id_name",
                table: "brand_themes",
                newName: "IX_brand_themes_tenant_id_name");

            migrationBuilder.RenameColumn(
                name: "location_details",
                table: "appointments",
                newName: "LocationDetails");

            migrationBuilder.RenameIndex(
                name: "ix_appointments_patient_id",
                table: "appointments",
                newName: "IX_appointments_patient_id");

            migrationBuilder.RenameIndex(
                name: "ix_appointments_cancelled_by",
                table: "appointments",
                newName: "IX_appointments_cancelled_by");

            migrationBuilder.RenameColumn(
                name: "metadata",
                table: "appointment_waitlist_entries",
                newName: "Metadata");

            migrationBuilder.AddColumn<string>(
                name: "affected_area",
                table: "medical_conditions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "aggravating_factors",
                table: "medical_conditions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "onset_type",
                table: "medical_conditions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "previous_treatments",
                table: "medical_conditions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "relieving_factors",
                table: "medical_conditions",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_pain_coordinates",
                table: "pain_coordinates",
                column: "PainMapId");

            migrationBuilder.CreateTable(
                name: "PainAssessments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    evaluation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    recorded_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    overall_pain_level = table.Column<int>(type: "integer", nullable: false),
                    functional_impact = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    pain_points_json = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric", nullable: true),
                    height_cm = table.Column<decimal>(type: "numeric", nullable: true),
                    bmi = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pain_assessments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "physio_histories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    severity = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_physio_histories", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PainAssessments_tenant_id_patient_id_recorded_at",
                table: "PainAssessments",
                columns: new[] { "tenant_id", "patient_id", "recorded_at" });

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries__users_patient_id",
                table: "appointment_waitlist_entries",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries__users_provider_id",
                table: "appointment_waitlist_entries",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries_appointments_matched_appointme~",
                table: "appointment_waitlist_entries",
                column: "matched_appointment_id",
                principalTable: "appointments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_users_cancelled_by",
                table: "appointments",
                column: "cancelled_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_users_patient_id",
                table: "appointments",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_users_provider_id",
                table: "appointments",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__evaluations_evaluation_id",
                table: "appointments",
                column: "evaluation_id",
                principalTable: "evaluations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__providers_provider_profile_id",
                table: "appointments",
                column: "provider_profile_id",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__tenants_tenant_id",
                table: "appointments",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_brand_themes__tenants_tenant_id",
                table: "brand_themes",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_conversations__users_patient_id",
                table: "conversations",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_conversations__users_provider_id",
                table: "conversations",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_document_audit_logs__users_user_id",
                table: "document_audit_log",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_documents__users_assigned_to_user_id",
                table: "documents",
                column: "assigned_to",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_documents__users_patient_id",
                table: "documents",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_documents__users_uploaded_by_user_id",
                table: "documents",
                column: "uploaded_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_evaluations_users_patient_id",
                table: "evaluations",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_evaluations_users_reviewed_by",
                table: "evaluations",
                column: "reviewed_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations__providers_provider_id",
                table: "evaluations",
                column: "provider_id",
                principalTable: "providers",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations__tenants_tenant_id",
                table: "evaluations",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_messages__providers_provider_profile_id",
                table: "messages",
                column: "provider_profile_id",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_messages__users_recipient_id",
                table: "messages",
                column: "direct_recipient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_messages__users_sender_id",
                table: "messages",
                column: "sender_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_notification_preferences__users_user_id",
                table: "notification_preferences",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications__users_recipient_id",
                table: "notifications",
                column: "recipient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications__users_sender_id",
                table: "notifications",
                column: "sender_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_pain_coordinates_pain_maps_PainMapId",
                table: "pain_coordinates",
                column: "PainMapId",
                principalTable: "pain_maps",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_booking_requests__prom_instances_prom_instance_id",
                table: "prom_booking_requests",
                column: "prom_instance_id",
                principalTable: "prom_instances",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_instances__prom_templates_template_id",
                table: "prom_instances",
                column: "template_id",
                principalTable: "prom_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_instances__users_patient_id",
                table: "prom_instances",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_responses__users_patient_id",
                table: "prom_responses",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_providers__users_user_id",
                table: "providers",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries__users_patient_id",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries__users_provider_id",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_appointment_waitlist_entries_appointments_matched_appointme~",
                table: "appointment_waitlist_entries");

            migrationBuilder.DropForeignKey(
                name: "FK_appointments_users_cancelled_by",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_appointments_users_patient_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_appointments_users_provider_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments__evaluations_evaluation_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments__providers_provider_profile_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments__tenants_tenant_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_brand_themes__tenants_tenant_id",
                table: "brand_themes");

            migrationBuilder.DropForeignKey(
                name: "fk_conversations__users_patient_id",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "fk_conversations__users_provider_id",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "fk_document_audit_logs__users_user_id",
                table: "document_audit_log");

            migrationBuilder.DropForeignKey(
                name: "fk_documents__users_assigned_to_user_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_documents__users_patient_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_documents__users_uploaded_by_user_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "FK_evaluations_users_patient_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_evaluations_users_reviewed_by",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations__providers_provider_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_evaluations__tenants_tenant_id",
                table: "evaluations");

            migrationBuilder.DropForeignKey(
                name: "fk_messages__providers_provider_profile_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_messages__users_recipient_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_messages__users_sender_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_notification_preferences__users_user_id",
                table: "notification_preferences");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications__users_recipient_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications__users_sender_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_pain_coordinates_pain_maps_PainMapId",
                table: "pain_coordinates");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_booking_requests__prom_instances_prom_instance_id",
                table: "prom_booking_requests");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_instances__prom_templates_template_id",
                table: "prom_instances");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_instances__users_patient_id",
                table: "prom_instances");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_responses__users_patient_id",
                table: "prom_responses");

            migrationBuilder.DropForeignKey(
                name: "fk_providers__users_user_id",
                table: "providers");

            migrationBuilder.DropTable(
                name: "PainAssessments");

            migrationBuilder.DropTable(
                name: "physio_histories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_pain_coordinates",
                table: "pain_coordinates");

            migrationBuilder.DropColumn(
                name: "affected_area",
                table: "medical_conditions");

            migrationBuilder.DropColumn(
                name: "aggravating_factors",
                table: "medical_conditions");

            migrationBuilder.DropColumn(
                name: "onset_type",
                table: "medical_conditions");

            migrationBuilder.DropColumn(
                name: "previous_treatments",
                table: "medical_conditions");

            migrationBuilder.DropColumn(
                name: "relieving_factors",
                table: "medical_conditions");

            migrationBuilder.RenameIndex(
                name: "IX_users_tenant_id_email",
                table: "users",
                newName: "ix_users_tenant_id_email");

            migrationBuilder.RenameIndex(
                name: "IX_users_cognito_id",
                table: "users",
                newName: "ix_users_cognito_sub");

            migrationBuilder.RenameIndex(
                name: "IX_user_roles_tenant_id_user_id_role_id",
                table: "user_roles",
                newName: "ix_user_roles_tenant_id_user_id_role_id");

            migrationBuilder.RenameColumn(
                name: "Settings",
                table: "tenants",
                newName: "settings");

            migrationBuilder.RenameIndex(
                name: "IX_tenants_slug",
                table: "tenants",
                newName: "ix_tenants_slug");

            migrationBuilder.RenameIndex(
                name: "IX_roles_tenant_id_name",
                table: "roles",
                newName: "ix_roles_tenant_id_name");

            migrationBuilder.RenameIndex(
                name: "IX_role_permissions_role_id_permission_id",
                table: "role_permissions",
                newName: "ix_role_permissions_role_id_permission_id");

            migrationBuilder.RenameIndex(
                name: "IX_providers_tenant_id_user_id",
                table: "providers",
                newName: "ix_providers_tenant_id_user_id");

            migrationBuilder.RenameColumn(
                name: "Questions",
                table: "prom_templates",
                newName: "questions");

            migrationBuilder.RenameColumn(
                name: "ScoringMethod",
                table: "prom_templates",
                newName: "scoring_method");

            migrationBuilder.RenameIndex(
                name: "IX_prom_templates_tenant_id_name",
                table: "prom_templates",
                newName: "ix_prom_templates_tenant_id_name");

            migrationBuilder.RenameIndex(
                name: "IX_prom_templates_tenant_id_key_version",
                table: "prom_templates",
                newName: "ix_prom_templates_tenant_id_key_version");

            migrationBuilder.RenameColumn(
                name: "Answers",
                table: "prom_responses",
                newName: "answers");

            migrationBuilder.RenameIndex(
                name: "IX_prom_responses_tenant_id_patient_id_completed_at",
                table: "prom_responses",
                newName: "ix_prom_responses_tenant_id_patient_id_completed_at");

            migrationBuilder.RenameColumn(
                name: "ResponseData",
                table: "prom_instances",
                newName: "response_data");

            migrationBuilder.RenameIndex(
                name: "IX_prom_instances_tenant_id_patient_id",
                table: "prom_instances",
                newName: "ix_prom_instances_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "IX_prom_booking_requests_tenant_id_prom_instance_id",
                table: "prom_booking_requests",
                newName: "ix_prom_booking_requests_tenant_id_prom_instance_id");

            migrationBuilder.RenameIndex(
                name: "IX_permissions_key",
                table: "permissions",
                newName: "ix_permissions_key");

            migrationBuilder.RenameColumn(
                name: "PainMapId",
                table: "pain_coordinates",
                newName: "pain_map_id");

            migrationBuilder.RenameColumn(
                name: "Data",
                table: "notifications",
                newName: "data");

            migrationBuilder.RenameIndex(
                name: "IX_notifications_tenant_id_recipient_id_created_at",
                table: "notifications",
                newName: "ix_notifications_tenant_id_recipient_id_created_at");

            migrationBuilder.RenameIndex(
                name: "IX_notification_preferences_tenant_id_user_id",
                table: "notification_preferences",
                newName: "ix_notification_preferences_tenant_id_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_messages_sender_id_direct_recipient_id",
                table: "messages",
                newName: "ix_messages_sender_id_direct_recipient_id");

            migrationBuilder.RenameIndex(
                name: "IX_messages_direct_recipient_id",
                table: "messages",
                newName: "ix_messages_direct_recipient_id");

            migrationBuilder.RenameIndex(
                name: "IX_messages_conversation_id_sent_at",
                table: "messages",
                newName: "ix_messages_conversation_id_sent_at");

            migrationBuilder.RenameIndex(
                name: "IX_medical_vitals_tenant_id_patient_id_recorded_at",
                table: "medical_vitals",
                newName: "ix_medical_vitals_tenant_id_patient_id_recorded_at");

            migrationBuilder.RenameIndex(
                name: "IX_medical_procedures_tenant_id_patient_id_procedure_date",
                table: "medical_procedures",
                newName: "ix_medical_procedures_tenant_id_patient_id_procedure_date");

            migrationBuilder.RenameIndex(
                name: "IX_medical_medications_tenant_id_patient_id_status",
                table: "medical_medications",
                newName: "ix_medical_medications_tenant_id_patient_id_status");

            migrationBuilder.RenameIndex(
                name: "IX_medical_lab_results_tenant_id_patient_id_category_result_da~",
                table: "medical_lab_results",
                newName: "ix_medical_lab_results_tenant_id_patient_id_category_result_da");

            migrationBuilder.RenameIndex(
                name: "IX_medical_immunizations_tenant_id_patient_id_date",
                table: "medical_immunizations",
                newName: "ix_medical_immunizations_tenant_id_patient_id_date");

            migrationBuilder.RenameColumn(
                name: "icd10_code",
                table: "medical_conditions",
                newName: "icd10code");

            migrationBuilder.RenameIndex(
                name: "IX_medical_conditions_tenant_id_patient_id_condition",
                table: "medical_conditions",
                newName: "ix_medical_conditions_tenant_id_patient_id_condition");

            migrationBuilder.RenameIndex(
                name: "IX_medical_allergies_tenant_id_patient_id_allergen",
                table: "medical_allergies",
                newName: "ix_medical_allergies_tenant_id_patient_id_allergen");

            migrationBuilder.RenameColumn(
                name: "QuestionnaireResponses",
                table: "evaluations",
                newName: "questionnaire_responses");

            migrationBuilder.RenameColumn(
                name: "MedicalHistory",
                table: "evaluations",
                newName: "medical_history");

            migrationBuilder.RenameIndex(
                name: "IX_evaluations_tenant_id_evaluation_number",
                table: "evaluations",
                newName: "ix_evaluations_tenant_id_evaluation_number");

            migrationBuilder.RenameIndex(
                name: "IX_evaluations_reviewed_by",
                table: "evaluations",
                newName: "ix_evaluations_reviewed_by");

            migrationBuilder.RenameIndex(
                name: "IX_evaluations_patient_id",
                table: "evaluations",
                newName: "ix_evaluations_patient_id");

            migrationBuilder.RenameColumn(
                name: "s3_key",
                table: "documents",
                newName: "s3key");

            migrationBuilder.RenameColumn(
                name: "s3_bucket",
                table: "documents",
                newName: "s3bucket");

            migrationBuilder.RenameColumn(
                name: "ExtractedIdentifiers",
                table: "documents",
                newName: "extracted_identifiers");

            migrationBuilder.RenameIndex(
                name: "IX_documents_uploaded_by",
                table: "documents",
                newName: "ix_documents_uploaded_by");

            migrationBuilder.RenameIndex(
                name: "IX_documents_tenant_id_patient_id",
                table: "documents",
                newName: "ix_documents_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "IX_documents_assigned_to",
                table: "documents",
                newName: "ix_documents_assigned_to");

            migrationBuilder.RenameColumn(
                name: "Metadata",
                table: "document_audit_log",
                newName: "metadata");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_tenant_id_patient_id",
                table: "conversations",
                newName: "ix_conversations_tenant_id_patient_id");

            migrationBuilder.RenameIndex(
                name: "IX_conversation_participants_conversation_id_user_id",
                table: "conversation_participants",
                newName: "ix_conversation_participants_conversation_id_user_id");

            migrationBuilder.RenameColumn(
                name: "Typography",
                table: "brand_themes",
                newName: "typography");

            migrationBuilder.RenameColumn(
                name: "WidgetConfig",
                table: "brand_themes",
                newName: "widget_config");

            migrationBuilder.RenameIndex(
                name: "IX_brand_themes_tenant_id_name",
                table: "brand_themes",
                newName: "ix_brand_themes_tenant_id_name");

            migrationBuilder.RenameColumn(
                name: "LocationDetails",
                table: "appointments",
                newName: "location_details");

            migrationBuilder.RenameIndex(
                name: "IX_appointments_patient_id",
                table: "appointments",
                newName: "ix_appointments_patient_id");

            migrationBuilder.RenameIndex(
                name: "IX_appointments_cancelled_by",
                table: "appointments",
                newName: "ix_appointments_cancelled_by");

            migrationBuilder.RenameColumn(
                name: "Metadata",
                table: "appointment_waitlist_entries",
                newName: "metadata");

            migrationBuilder.AddPrimaryKey(
                name: "pk_pain_coordinates",
                table: "pain_coordinates",
                column: "pain_map_id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries_appointments_matched_appointme",
                table: "appointment_waitlist_entries",
                column: "matched_appointment_id",
                principalTable: "appointments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries_users_patient_id",
                table: "appointment_waitlist_entries",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_waitlist_entries_users_provider_id",
                table: "appointment_waitlist_entries",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_evaluations_evaluation_id",
                table: "appointments",
                column: "evaluation_id",
                principalTable: "evaluations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_providers_provider_profile_id",
                table: "appointments",
                column: "provider_profile_id",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_tenants_tenant_id",
                table: "appointments",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_users_cancelled_by",
                table: "appointments",
                column: "cancelled_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_users_patient_id",
                table: "appointments",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_users_provider_id",
                table: "appointments",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_brand_themes_tenants_tenant_id",
                table: "brand_themes",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_conversations_users_patient_id",
                table: "conversations",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_conversations_users_provider_id",
                table: "conversations",
                column: "provider_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_document_audit_logs_users_user_id",
                table: "document_audit_log",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_documents_users_assigned_to_user_id",
                table: "documents",
                column: "assigned_to",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_documents_users_patient_id",
                table: "documents",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_documents_users_uploaded_by_user_id",
                table: "documents",
                column: "uploaded_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations_providers_provider_id",
                table: "evaluations",
                column: "provider_id",
                principalTable: "providers",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations_tenants_tenant_id",
                table: "evaluations",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations_users_patient_id",
                table: "evaluations",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_evaluations_users_reviewed_by",
                table: "evaluations",
                column: "reviewed_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_providers_provider_profile_id",
                table: "messages",
                column: "provider_profile_id",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_users_recipient_id",
                table: "messages",
                column: "direct_recipient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_users_sender_id",
                table: "messages",
                column: "sender_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_notification_preferences_users_user_id",
                table: "notification_preferences",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications_users_recipient_id",
                table: "notifications",
                column: "recipient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications_users_sender_id",
                table: "notifications",
                column: "sender_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_pain_coordinates_pain_maps_pain_map_id",
                table: "pain_coordinates",
                column: "pain_map_id",
                principalTable: "pain_maps",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_booking_requests_prom_instances_prom_instance_id",
                table: "prom_booking_requests",
                column: "prom_instance_id",
                principalTable: "prom_instances",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_instances_prom_templates_template_id",
                table: "prom_instances",
                column: "template_id",
                principalTable: "prom_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_instances_users_patient_id",
                table: "prom_instances",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_responses_users_patient_id",
                table: "prom_responses",
                column: "patient_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_providers_users_user_id",
                table: "providers",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
