using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLinkedDeviceUsageToTreatmentPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_patient_device_usages__treatment_plans_treatment_plan_id",
                table: "patient_device_usages");

            migrationBuilder.RenameIndex(
                name: "ix_patient_device_usages_treatment_plan_id",
                table: "patient_device_usages",
                newName: "IX_patient_device_usages_treatment_plan_id");

            migrationBuilder.AddColumn<Guid>(
                name: "linked_device_usage_id",
                table: "treatment_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_treatment_plans_linked_device_usage_id",
                table: "treatment_plans",
                column: "linked_device_usage_id");

            migrationBuilder.AddForeignKey(
                name: "FK_patient_device_usages_treatment_plans_treatment_plan_id",
                table: "patient_device_usages",
                column: "treatment_plan_id",
                principalTable: "treatment_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_patient_device_usages__treatment_plans_treatment_plan_id1",
                table: "treatment_plans",
                column: "linked_device_usage_id",
                principalTable: "patient_device_usages",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_patient_device_usages_treatment_plans_treatment_plan_id",
                table: "patient_device_usages");

            migrationBuilder.DropForeignKey(
                name: "fk_patient_device_usages__treatment_plans_treatment_plan_id1",
                table: "treatment_plans");

            migrationBuilder.DropIndex(
                name: "IX_treatment_plans_linked_device_usage_id",
                table: "treatment_plans");

            migrationBuilder.DropColumn(
                name: "linked_device_usage_id",
                table: "treatment_plans");

            migrationBuilder.RenameIndex(
                name: "IX_patient_device_usages_treatment_plan_id",
                table: "patient_device_usages",
                newName: "ix_patient_device_usages_treatment_plan_id");

            migrationBuilder.AddForeignKey(
                name: "fk_patient_device_usages__treatment_plans_treatment_plan_id",
                table: "patient_device_usages",
                column: "treatment_plan_id",
                principalTable: "treatment_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
