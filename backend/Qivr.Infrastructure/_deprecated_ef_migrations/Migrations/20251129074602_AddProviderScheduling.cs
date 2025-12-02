using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Qivr.Core.Entities;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<TreatmentMilestone>>(
                name: "Milestones",
                table: "treatment_plans",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddColumn<List<TreatmentPhase>>(
                name: "Phases",
                table: "treatment_plans",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddColumn<TreatmentPlanPromConfig>(
                name: "PromConfig",
                table: "treatment_plans",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ai_confidence",
                table: "treatment_plans",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ai_generated_at",
                table: "treatment_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_generated_summary",
                table: "treatment_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_rationale",
                table: "treatment_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "approved_at",
                table: "treatment_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "approved_by",
                table: "treatment_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "completed_sessions",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "current_week",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "exercise_streak",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "points_earned",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "progress_percentage",
                table: "treatment_plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "source_evaluation_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "total_sessions",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "daily_check_in",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    pain_level = table.Column<int>(type: "integer", nullable: false),
                    mood = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    exercises_completed = table.Column<int>(type: "integer", nullable: false),
                    exercises_assigned = table.Column<int>(type: "integer", nullable: false),
                    points_earned = table.Column<int>(type: "integer", nullable: false),
                    continued_streak = table.Column<bool>(type: "boolean", nullable: false),
                    treatment_plan_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_daily_check_in", x => x.id);
                    table.ForeignKey(
                        name: "fk_daily_check_in__treatment_plans_treatment_plan_id",
                        column: x => x.treatment_plan_id,
                        principalTable: "treatment_plans",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "exercise_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    instructions = table.Column<string>(type: "text", nullable: true),
                    default_sets = table.Column<int>(type: "integer", nullable: false),
                    default_reps = table.Column<int>(type: "integer", nullable: false),
                    default_hold_seconds = table.Column<int>(type: "integer", nullable: true),
                    default_frequency = table.Column<string>(type: "text", nullable: true),
                    video_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    thumbnail_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    body_region = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    difficulty = table.Column<string>(type: "text", nullable: false),
                    target_conditions = table.Column<List<string>>(type: "jsonb", nullable: false),
                    contraindications = table.Column<List<string>>(type: "jsonb", nullable: false),
                    equipment = table.Column<List<string>>(type: "jsonb", nullable: false),
                    tags = table.Column<List<string>>(type: "jsonb", nullable: false),
                    is_system_exercise = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "provider_schedule_overrides",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_working_day = table.Column<bool>(type: "boolean", nullable: false),
                    start_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    end_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_schedule_overrides", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_schedule_overrides_providers_provider_id",
                        column: x => x.provider_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "provider_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    is_working_day = table.Column<bool>(type: "boolean", nullable: false),
                    start_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    end_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    break_start_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    break_end_time = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    location_id = table.Column<Guid>(type: "uuid", nullable: true),
                    default_slot_duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    buffer_minutes = table.Column<int>(type: "integer", nullable: false),
                    allows_telehealth = table.Column<bool>(type: "boolean", nullable: false),
                    allows_in_person = table.Column<bool>(type: "boolean", nullable: false),
                    max_appointments_per_day = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_schedules", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_schedules_providers_provider_id",
                        column: x => x.provider_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "provider_time_offs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_all_day = table.Column<bool>(type: "boolean", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_approved = table.Column<bool>(type: "boolean", nullable: false),
                    approved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    recurrence_pattern = table.Column<string>(type: "text", nullable: true),
                    recurrence_end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_time_offs", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_time_offs_providers_provider_id",
                        column: x => x.provider_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_treatment_plans_source_evaluation_id",
                table: "treatment_plans",
                column: "source_evaluation_id");

            migrationBuilder.CreateIndex(
                name: "ix_daily_check_in_treatment_plan_id",
                table: "daily_check_in",
                column: "treatment_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_exercise_templates_is_system_exercise",
                table: "exercise_templates",
                column: "is_system_exercise");

            migrationBuilder.CreateIndex(
                name: "IX_exercise_templates_tenant_id_category_body_region",
                table: "exercise_templates",
                columns: new[] { "tenant_id", "category", "body_region" });

            migrationBuilder.CreateIndex(
                name: "IX_exercise_templates_tenant_id_name",
                table: "exercise_templates",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_provider_schedule_overrides_provider_id",
                table: "provider_schedule_overrides",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "IX_provider_schedule_overrides_tenant_id_provider_id_date",
                table: "provider_schedule_overrides",
                columns: new[] { "tenant_id", "provider_id", "date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_provider_schedules_provider_id",
                table: "provider_schedules",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "IX_provider_schedules_tenant_id_provider_id_day_of_week",
                table: "provider_schedules",
                columns: new[] { "tenant_id", "provider_id", "day_of_week" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_provider_time_offs_provider_id",
                table: "provider_time_offs",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "IX_provider_time_offs_tenant_id_provider_id_start_date_time_en~",
                table: "provider_time_offs",
                columns: new[] { "tenant_id", "provider_id", "start_date_time", "end_date_time" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_check_in");

            migrationBuilder.DropTable(
                name: "exercise_templates");

            migrationBuilder.DropTable(
                name: "provider_schedule_overrides");

            migrationBuilder.DropTable(
                name: "provider_schedules");

            migrationBuilder.DropTable(
                name: "provider_time_offs");

            migrationBuilder.DropIndex(
                name: "IX_treatment_plans_source_evaluation_id",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "Milestones",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "Phases",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "PromConfig",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "ai_confidence",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "ai_generated_at",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "ai_generated_summary",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "ai_rationale",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "approved_at",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "approved_by",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "completed_sessions",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "current_week",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "exercise_streak",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "points_earned",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "progress_percentage",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "source_evaluation_id",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "total_sessions",
                table: "treatment_plans");
        }
    }
}
