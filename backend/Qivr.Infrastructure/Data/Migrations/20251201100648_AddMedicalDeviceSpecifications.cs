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
            // Use idempotent SQL to avoid errors if columns already exist
            migrationBuilder.Sql(@"
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS expectation_match INTEGER;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS global_perceived_effect INTEGER;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS patient_acceptable_symptom_state BOOLEAN;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS patient_narrative TEXT;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS perceived_success BOOLEAN;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;
                ALTER TABLE prom_instances ADD COLUMN IF NOT EXISTS would_recommend INTEGER;
                ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS global_availability VARCHAR(2000);
                ALTER TABLE medical_devices ADD COLUMN IF NOT EXISTS technical_specifications VARCHAR(4000);
            ");
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
