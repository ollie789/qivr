using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPainDrawingSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "avatar_type",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "body_subdivision",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "depth_indicator",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "drawing_data_json",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "submission_source",
                table: "pain_maps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "view_orientation",
                table: "pain_maps",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "avatar_type",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "body_subdivision",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "depth_indicator",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "drawing_data_json",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "submission_source",
                table: "pain_maps");

            migrationBuilder.DropColumn(
                name: "view_orientation",
                table: "pain_maps");
        }
    }
}
