using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageProviderProfileLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "provider_profile_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_messages_provider_profile_id",
                table: "messages",
                column: "provider_profile_id");

            migrationBuilder.AddForeignKey(
                name: "fk_messages_providers_provider_profile_id",
                table: "messages",
                column: "provider_profile_id",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_messages_providers_provider_profile_id",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_messages_provider_profile_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "provider_profile_id",
                table: "messages");
        }
    }
}
