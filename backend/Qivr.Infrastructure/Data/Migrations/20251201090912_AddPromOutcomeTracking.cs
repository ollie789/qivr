using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPromOutcomeTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "instance_type",
                table: "prom_instances",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "treatment_plan_id",
                table: "prom_instances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "weeks_post_procedure",
                table: "prom_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "baseline_captured_at",
                table: "patient_device_usages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "baseline_prom_instance_id",
                table: "patient_device_usages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "baseline_prom_type",
                table: "patient_device_usages",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "baseline_score",
                table: "patient_device_usages",
                type: "numeric",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_prom_instances_treatment_plan_id",
                table: "prom_instances",
                column: "treatment_plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_device_usages_baseline_prom_instance_id",
                table: "patient_device_usages",
                column: "baseline_prom_instance_id");

            migrationBuilder.AddForeignKey(
                name: "fk_patient_device_usages__prom_instances_baseline_prom_instance_~",
                table: "patient_device_usages",
                column: "baseline_prom_instance_id",
                principalTable: "prom_instances",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_instances__treatment_plans_treatment_plan_id",
                table: "prom_instances",
                column: "treatment_plan_id",
                principalTable: "treatment_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_patient_device_usages__prom_instances_baseline_prom_instance_~",
                table: "patient_device_usages");

            migrationBuilder.DropForeignKey(
                name: "fk_prom_instances__treatment_plans_treatment_plan_id",
                table: "prom_instances");

            migrationBuilder.DropIndex(
                name: "ix_prom_instances_treatment_plan_id",
                table: "prom_instances");

            migrationBuilder.DropIndex(
                name: "ix_patient_device_usages_baseline_prom_instance_id",
                table: "patient_device_usages");

            migrationBuilder.DropColumn(
                name: "instance_type",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "treatment_plan_id",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "weeks_post_procedure",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "baseline_captured_at",
                table: "patient_device_usages");

            migrationBuilder.DropColumn(
                name: "baseline_prom_instance_id",
                table: "patient_device_usages");

            migrationBuilder.DropColumn(
                name: "baseline_prom_type",
                table: "patient_device_usages");

            migrationBuilder.DropColumn(
                name: "baseline_score",
                table: "patient_device_usages");
        }
    }
}
