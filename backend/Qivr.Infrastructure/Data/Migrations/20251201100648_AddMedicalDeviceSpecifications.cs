using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalDeviceSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "expectation_match",
                table: "prom_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "global_perceived_effect",
                table: "prom_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "patient_acceptable_symptom_state",
                table: "prom_instances",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "patient_narrative",
                table: "prom_instances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "perceived_success",
                table: "prom_instances",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "satisfaction_score",
                table: "prom_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "would_recommend",
                table: "prom_instances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "global_availability",
                table: "medical_devices",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "technical_specifications",
                table: "medical_devices",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "expectation_match",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "global_perceived_effect",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "patient_acceptable_symptom_state",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "patient_narrative",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "perceived_success",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "satisfaction_score",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "would_recommend",
                table: "prom_instances");

            migrationBuilder.DropColumn(
                name: "global_availability",
                table: "medical_devices");

            migrationBuilder.DropColumn(
                name: "technical_specifications",
                table: "medical_devices");
        }
    }
}
