using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "clinics",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    zip_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinics", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_allergies",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allergen = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reaction = table.Column<string>(type: "text", nullable: false),
                    diagnosed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_allergies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_conditions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    condition = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    icd10code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    diagnosed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    managed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    last_reviewed = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_conditions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_immunizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vaccine = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    next_due = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    facility = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    lot_number = table.Column<string>(type: "text", nullable: true),
                    series = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_immunizations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_lab_results",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_lab_results", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_medications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_medications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medical_vitals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_vitals", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "prom_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "text", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    category = table.Column<string>(type: "text", nullable: false),
                    frequency = table.Column<string>(type: "text", nullable: false),
                    questions = table.Column<string>(type: "text", nullable: false),
                    scoring_method = table.Column<string>(type: "text", nullable: true),
                    scoring_rules = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    settings = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tenants", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "brand_themes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    logo_url = table.Column<string>(type: "text", nullable: true),
                    favicon_url = table.Column<string>(type: "text", nullable: true),
                    primary_color = table.Column<string>(type: "text", nullable: true),
                    secondary_color = table.Column<string>(type: "text", nullable: true),
                    accent_color = table.Column<string>(type: "text", nullable: true),
                    typography = table.Column<string>(type: "text", nullable: false),
                    custom_css = table.Column<string>(type: "text", nullable: true),
                    widget_config = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_brand_themes", x => x.id);
                    table.ForeignKey(
                        name: "fk_brand_themes_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cognito_id = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: true),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "text", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.ForeignKey(
                        name: "fk_users_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: true),
                    subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    priority = table.Column<string>(type: "text", nullable: false),
                    last_message_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversations", x => x.id);
                    table.ForeignKey(
                        name: "fk_conversations_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_conversations_users_provider_id",
                        column: x => x.provider_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    document_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    content_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    storage_path = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false),
                    archived_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_confidential = table.Column<bool>(type: "boolean", nullable: false),
                    requires_review = table.Column<bool>(type: "boolean", nullable: false),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    tags = table.Column<string>(type: "text", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_documents", x => x.id);
                    table.ForeignKey(
                        name: "fk_documents_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    sms_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    push_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    in_app_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    appointment_reminders = table.Column<bool>(type: "boolean", nullable: false),
                    prom_reminders = table.Column<bool>(type: "boolean", nullable: false),
                    evaluation_notifications = table.Column<bool>(type: "boolean", nullable: false),
                    clinic_announcements = table.Column<bool>(type: "boolean", nullable: false),
                    system_notifications = table.Column<bool>(type: "boolean", nullable: false),
                    reminder_hours_before = table.Column<int>(type: "integer", nullable: false),
                    preferred_time_zone = table.Column<string>(type: "text", nullable: false),
                    quiet_hours_start = table.Column<int>(type: "integer", nullable: true),
                    quiet_hours_end = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_preferences", x => x.id);
                    table.ForeignKey(
                        name: "fk_notification_preferences_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    channel = table.Column<string>(type: "text", nullable: false),
                    priority = table.Column<string>(type: "text", nullable: false),
                    data = table.Column<string>(type: "text", nullable: true),
                    scheduled_for = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reminder_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_users_recipient_id",
                        column: x => x.recipient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_notifications_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "prom_instances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    scheduled_for = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    response_data = table.Column<string>(type: "text", nullable: true),
                    score = table.Column<decimal>(type: "numeric", nullable: true),
                    reminder_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_instances", x => x.id);
                    table.ForeignKey(
                        name: "fk_prom_instances_prom_templates_template_id",
                        column: x => x.template_id,
                        principalTable: "prom_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prom_instances_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "providers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    specialty = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    license_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    npi_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_providers", x => x.id);
                    table.ForeignKey(
                        name: "fk_providers_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_providers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "conversation_participants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_name = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    left_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    unread_count = table.Column<int>(type: "integer", nullable: false),
                    is_muted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversation_participants", x => x.id);
                    table.ForeignKey(
                        name: "fk_conversation_participants_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: false),
                    direct_recipient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_name = table.Column<string>(type: "text", nullable: true),
                    sender_role = table.Column<string>(type: "text", nullable: true),
                    direct_subject = table.Column<string>(type: "text", nullable: true),
                    direct_message_type = table.Column<string>(type: "text", nullable: true),
                    direct_priority = table.Column<string>(type: "text", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    edited_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    attachment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_system_message = table.Column<bool>(type: "boolean", nullable: false),
                    parent_message_id = table.Column<Guid>(type: "uuid", nullable: true),
                    related_appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_by_recipient = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_by_sender = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_documents_attachment_id",
                        column: x => x.attachment_id,
                        principalTable: "documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_messages_messages_parent_message_id",
                        column: x => x.parent_message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_messages_users_recipient_id",
                        column: x => x.direct_recipient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "prom_booking_requests",
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
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "evaluations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    evaluation_number = table.Column<string>(type: "text", nullable: false),
                    chief_complaint = table.Column<string>(type: "text", nullable: true),
                    symptoms = table.Column<string[]>(type: "text[]", nullable: false),
                    medical_history = table.Column<string>(type: "text", nullable: false),
                    questionnaire_responses = table.Column<string>(type: "text", nullable: false),
                    ai_summary = table.Column<string>(type: "text", nullable: true),
                    ai_risk_flags = table.Column<string[]>(type: "text[]", nullable: false),
                    ai_processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    clinician_notes = table.Column<string>(type: "text", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    urgency = table.Column<string>(type: "text", nullable: true),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_evaluations", x => x.id);
                    table.ForeignKey(
                        name: "fk_evaluations_providers_provider_id",
                        column: x => x.provider_id,
                        principalTable: "providers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_evaluations_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_evaluations_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_evaluations_users_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    clinic_id = table.Column<Guid>(type: "uuid", nullable: true),
                    evaluation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    external_calendar_id = table.Column<string>(type: "text", nullable: true),
                    appointment_type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    scheduled_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    scheduled_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    actual_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actual_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    location_type = table.Column<string>(type: "text", nullable: false),
                    location_details = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    cancellation_reason = table.Column<string>(type: "text", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_by = table.Column<Guid>(type: "uuid", nullable: true),
                    reminder_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_paid = table.Column<bool>(type: "boolean", nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    payment_method = table.Column<string>(type: "text", nullable: true),
                    payment_reference = table.Column<string>(type: "text", nullable: true),
                    payment_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    payment_notes = table.Column<string>(type: "text", nullable: true),
                    provider_id1 = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointments", x => x.id);
                    table.ForeignKey(
                        name: "fk_appointments_clinics_clinic_id",
                        column: x => x.clinic_id,
                        principalTable: "clinics",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_appointments_evaluations_evaluation_id",
                        column: x => x.evaluation_id,
                        principalTable: "evaluations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_appointments_providers_provider_id",
                        column: x => x.provider_id1,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_appointments_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_appointments_users_cancelled_by",
                        column: x => x.cancelled_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_appointments_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_appointments_users_provider_id",
                        column: x => x.provider_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "pain_maps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    evaluation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    body_region = table.Column<string>(type: "text", nullable: false),
                    anatomical_code = table.Column<string>(type: "text", nullable: true),
                    pain_intensity = table.Column<int>(type: "integer", nullable: false),
                    pain_type = table.Column<string>(type: "text", nullable: true),
                    pain_quality = table.Column<string[]>(type: "text[]", nullable: false),
                    onset_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pain_maps", x => x.id);
                    table.ForeignKey(
                        name: "fk_pain_maps_evaluations_evaluation_id",
                        column: x => x.evaluation_id,
                        principalTable: "evaluations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "appointment_waitlist_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: true),
                    appointment_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    preferred_dates = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    fulfilled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    matched_appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    metadata = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointment_waitlist_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_appointment_waitlist_entries_appointments_matched_appointme",
                        column: x => x.matched_appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_appointment_waitlist_entries_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_appointment_waitlist_entries_users_provider_id",
                        column: x => x.provider_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "prom_responses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    prom_instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    prom_type = table.Column<string>(type: "text", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    score = table.Column<decimal>(type: "numeric", nullable: false),
                    severity = table.Column<string>(type: "text", nullable: false),
                    answers = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_responses", x => x.id);
                    table.ForeignKey(
                        name: "fk_prom_responses_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_prom_responses_prom_instances_prom_instance_id",
                        column: x => x.prom_instance_id,
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prom_responses_users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pain_coordinates",
                columns: table => new
                {
                    pain_map_id = table.Column<Guid>(type: "uuid", nullable: false),
                    coordinate_x = table.Column<float>(type: "real", nullable: false),
                    coordinate_y = table.Column<float>(type: "real", nullable: false),
                    coordinate_z = table.Column<float>(type: "real", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pain_coordinates", x => x.pain_map_id);
                    table.ForeignKey(
                        name: "fk_pain_coordinates_pain_maps_pain_map_id",
                        column: x => x.pain_map_id,
                        principalTable: "pain_maps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_matched_appointment_id",
                table: "appointment_waitlist_entries",
                column: "matched_appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_patient_id",
                table: "appointment_waitlist_entries",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_patient_status",
                table: "appointment_waitlist_entries",
                columns: new[] { "tenant_id", "patient_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_provider_id",
                table: "appointment_waitlist_entries",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_waitlist_entries_tenant_status",
                table: "appointment_waitlist_entries",
                columns: new[] { "tenant_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_cancelled_by",
                table: "appointments",
                column: "cancelled_by");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_clinic_id",
                table: "appointments",
                column: "clinic_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_evaluation_id",
                table: "appointments",
                column: "evaluation_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_patient_id",
                table: "appointments",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_provider_id1",
                table: "appointments",
                column: "provider_id1");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_tenant_id",
                table: "appointments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "no_double_booking",
                table: "appointments",
                columns: new[] { "provider_id", "scheduled_start", "scheduled_end" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_brand_themes_tenant_id_name",
                table: "brand_themes",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_clinics_tenant_id_name",
                table: "clinics",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_conversation_participants_conversation_id_user_id",
                table: "conversation_participants",
                columns: new[] { "conversation_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_conversations_patient_id",
                table: "conversations",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_conversations_provider_id",
                table: "conversations",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_conversations_tenant_id_patient_id",
                table: "conversations",
                columns: new[] { "tenant_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_documents_patient_id",
                table: "documents",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_documents_tenant_id_patient_id",
                table: "documents",
                columns: new[] { "tenant_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_evaluations_patient_id",
                table: "evaluations",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_evaluations_provider_id",
                table: "evaluations",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_evaluations_reviewed_by",
                table: "evaluations",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "ix_evaluations_tenant_id_evaluation_number",
                table: "evaluations",
                columns: new[] { "tenant_id", "evaluation_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_medical_allergies_tenant_id_patient_id_allergen",
                table: "medical_allergies",
                columns: new[] { "tenant_id", "patient_id", "allergen" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_conditions_tenant_id_patient_id_condition",
                table: "medical_conditions",
                columns: new[] { "tenant_id", "patient_id", "condition" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_immunizations_tenant_id_patient_id_date",
                table: "medical_immunizations",
                columns: new[] { "tenant_id", "patient_id", "date" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_lab_results_tenant_id_patient_id_category_result_da",
                table: "medical_lab_results",
                columns: new[] { "tenant_id", "patient_id", "category", "result_date" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_medications_tenant_id_patient_id_status",
                table: "medical_medications",
                columns: new[] { "tenant_id", "patient_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_vitals_tenant_id_patient_id_recorded_at",
                table: "medical_vitals",
                columns: new[] { "tenant_id", "patient_id", "recorded_at" });

            migrationBuilder.CreateIndex(
                name: "ix_messages_attachment_id",
                table: "messages",
                column: "attachment_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_sent_at",
                table: "messages",
                columns: new[] { "conversation_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "ix_messages_direct_recipient_id",
                table: "messages",
                column: "direct_recipient_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_parent_message_id",
                table: "messages",
                column: "parent_message_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_sender_id_direct_recipient_id",
                table: "messages",
                columns: new[] { "sender_id", "direct_recipient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_notification_preferences_tenant_id_user_id",
                table: "notification_preferences",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_preferences_user_id",
                table: "notification_preferences",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_id",
                table: "notifications",
                column: "recipient_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_sender_id",
                table: "notifications",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_tenant_id_recipient_id_created_at",
                table: "notifications",
                columns: new[] { "tenant_id", "recipient_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_pain_maps_evaluation_id",
                table: "pain_maps",
                column: "evaluation_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_booking_requests_prom_instance_id",
                table: "prom_booking_requests",
                column: "prom_instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_booking_requests_tenant_id_prom_instance_id",
                table: "prom_booking_requests",
                columns: new[] { "tenant_id", "prom_instance_id" });

            migrationBuilder.CreateIndex(
                name: "ix_prom_instances_patient_id",
                table: "prom_instances",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_instances_template_id",
                table: "prom_instances",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_instances_tenant_id_patient_id",
                table: "prom_instances",
                columns: new[] { "tenant_id", "patient_id" });

            migrationBuilder.CreateIndex(
                name: "ix_prom_responses_appointment_id",
                table: "prom_responses",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_responses_patient_id",
                table: "prom_responses",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_responses_prom_instance_id",
                table: "prom_responses",
                column: "prom_instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_prom_responses_tenant_id_patient_id_completed_at",
                table: "prom_responses",
                columns: new[] { "tenant_id", "patient_id", "completed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_prom_templates_tenant_id_key_version",
                table: "prom_templates",
                columns: new[] { "tenant_id", "key", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_prom_templates_tenant_id_name",
                table: "prom_templates",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_providers_clinic_id",
                table: "providers",
                column: "clinic_id");

            migrationBuilder.CreateIndex(
                name: "ix_providers_tenant_id_user_id_clinic_id",
                table: "providers",
                columns: new[] { "tenant_id", "user_id", "clinic_id" });

            migrationBuilder.CreateIndex(
                name: "ix_providers_user_id",
                table: "providers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_tenants_slug",
                table: "tenants",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_cognito_sub",
                table: "users",
                column: "cognito_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_tenant_id_email",
                table: "users",
                columns: new[] { "tenant_id", "email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointment_waitlist_entries");

            migrationBuilder.DropTable(
                name: "brand_themes");

            migrationBuilder.DropTable(
                name: "conversation_participants");

            migrationBuilder.DropTable(
                name: "medical_allergies");

            migrationBuilder.DropTable(
                name: "medical_conditions");

            migrationBuilder.DropTable(
                name: "medical_immunizations");

            migrationBuilder.DropTable(
                name: "medical_lab_results");

            migrationBuilder.DropTable(
                name: "medical_medications");

            migrationBuilder.DropTable(
                name: "medical_vitals");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "notification_preferences");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "pain_coordinates");

            migrationBuilder.DropTable(
                name: "prom_booking_requests");

            migrationBuilder.DropTable(
                name: "prom_responses");

            migrationBuilder.DropTable(
                name: "conversations");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropTable(
                name: "pain_maps");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "prom_instances");

            migrationBuilder.DropTable(
                name: "evaluations");

            migrationBuilder.DropTable(
                name: "prom_templates");

            migrationBuilder.DropTable(
                name: "providers");

            migrationBuilder.DropTable(
                name: "clinics");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "tenants");
        }
    }
}
