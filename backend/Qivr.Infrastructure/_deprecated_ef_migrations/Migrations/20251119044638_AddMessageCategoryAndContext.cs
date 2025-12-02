using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageCategoryAndContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "related_entity_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "related_entity_type",
                table: "messages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "category",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "related_entity_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "related_entity_type",
                table: "messages");
        }
    }
}
