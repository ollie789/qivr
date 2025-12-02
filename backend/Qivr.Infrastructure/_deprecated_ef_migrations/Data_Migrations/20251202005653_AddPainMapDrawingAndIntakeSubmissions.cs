using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPainMapDrawingAndIntakeSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Metadata",
                table: "admin_audit_logs",
                newName: "metadata");

            migrationBuilder.AddColumn<string>(
                name: "api_key_hash",
                table: "research_partners",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            // Add missing pain_maps columns for 3D pain drawing support
            migrationBuilder.AddColumn<string>(
                name: "avatar_type",
                schema: "qivr",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "body_subdivision",
                schema: "qivr",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "view_orientation",
                schema: "qivr",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "depth_indicator",
                schema: "qivr",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "submission_source",
                schema: "qivr",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "drawing_data_json",
                schema: "qivr",
                table: "pain_maps",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "intake_submissions",
                schema: "qivr",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    evaluation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_name = table.Column<string>(type: "text", nullable: false),
                    patient_email = table.Column<string>(type: "text", nullable: false),
                    condition_type = table.Column<string>(type: "text", nullable: true),
                    pain_level = table.Column<int>(type: "integer", nullable: false),
                    severity = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_intake_submissions", x => x.id);
                    table.ForeignKey(
                        name: "fk_intake_submissions_evaluations_evaluation_id",
                        column: x => x.evaluation_id,
                        principalSchema: "qivr",
                        principalTable: "evaluations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_intake_submissions_evaluation_id",
                schema: "qivr",
                table: "intake_submissions",
                column: "evaluation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "intake_submissions",
                schema: "qivr");

            migrationBuilder.DropColumn(
                name: "drawing_data_json",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "submission_source",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "depth_indicator",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "view_orientation",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "body_subdivision",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "avatar_type",
                schema: "qivr",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "api_key_hash",
                table: "research_partners");

            migrationBuilder.RenameColumn(
                name: "metadata",
                table: "admin_audit_logs",
                newName: "Metadata");
        }
    }
}
