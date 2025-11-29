using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceTreatmentPlanWithPhasesAndMilestones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AI Generation Metadata
            migrationBuilder.AddColumn<string>(
                name: "ai_generated_summary",
                table: "treatment_plans",
                type: "text",
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

            migrationBuilder.AddColumn<Guid>(
                name: "source_evaluation_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_rationale",
                table: "treatment_plans",
                type: "text",
                nullable: true);

            // Phase-based structure (JSONB)
            migrationBuilder.AddColumn<string>(
                name: "phases",
                table: "treatment_plans",
                type: "jsonb",
                nullable: true);

            // PROM Configuration (JSONB)
            migrationBuilder.AddColumn<string>(
                name: "prom_config",
                table: "treatment_plans",
                type: "jsonb",
                nullable: true);

            // Progress Tracking
            migrationBuilder.AddColumn<int>(
                name: "total_sessions",
                table: "treatment_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "completed_sessions",
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

            // Milestones (JSONB)
            migrationBuilder.AddColumn<string>(
                name: "milestones",
                table: "treatment_plans",
                type: "jsonb",
                nullable: true);

            // Approval Workflow
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

            // Add index for source evaluation lookup
            migrationBuilder.CreateIndex(
                name: "ix_treatment_plans_source_evaluation_id",
                table: "treatment_plans",
                column: "source_evaluation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_treatment_plans_source_evaluation_id",
                table: "treatment_plans");

            migrationBuilder.DropColumn(name: "ai_generated_summary", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "ai_confidence", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "ai_generated_at", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "source_evaluation_id", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "ai_rationale", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "phases", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "prom_config", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "total_sessions", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "completed_sessions", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "progress_percentage", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "current_week", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "exercise_streak", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "points_earned", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "milestones", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "approved_at", table: "treatment_plans");
            migrationBuilder.DropColumn(name: "approved_by", table: "treatment_plans");
        }
    }
}
