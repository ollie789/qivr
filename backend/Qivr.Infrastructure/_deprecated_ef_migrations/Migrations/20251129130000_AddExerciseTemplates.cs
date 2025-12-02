using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    target_conditions = table.Column<string>(type: "jsonb", nullable: true),
                    contraindications = table.Column<string>(type: "jsonb", nullable: true),
                    equipment = table.Column<string>(type: "jsonb", nullable: true),
                    tags = table.Column<string>(type: "jsonb", nullable: true),
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

            migrationBuilder.CreateIndex(
                name: "ix_exercise_templates_is_system_exercise",
                table: "exercise_templates",
                column: "is_system_exercise");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_templates_tenant_id_category_body_region",
                table: "exercise_templates",
                columns: new[] { "tenant_id", "category", "body_region" });

            migrationBuilder.CreateIndex(
                name: "ix_exercise_templates_tenant_id_name",
                table: "exercise_templates",
                columns: new[] { "tenant_id", "name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exercise_templates");
        }
    }
}
