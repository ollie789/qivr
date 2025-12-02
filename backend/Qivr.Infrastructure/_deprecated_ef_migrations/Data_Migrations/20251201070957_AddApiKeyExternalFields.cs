using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApiKeyExternalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "contact_email",
                table: "api_keys",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "partner_name",
                table: "api_keys",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "rate_limit_per_hour",
                table: "api_keys",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "rate_limit_reset_at",
                table: "api_keys",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "requests_this_hour",
                table: "api_keys",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_api_keys_tenant_id",
                table: "api_keys",
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: "fk_api_keys__tenants_tenant_id",
                table: "api_keys",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_api_keys__tenants_tenant_id",
                table: "api_keys");

            migrationBuilder.DropIndex(
                name: "ix_api_keys_tenant_id",
                table: "api_keys");

            migrationBuilder.DropColumn(
                name: "contact_email",
                table: "api_keys");

            migrationBuilder.DropColumn(
                name: "partner_name",
                table: "api_keys");

            migrationBuilder.DropColumn(
                name: "rate_limit_per_hour",
                table: "api_keys");

            migrationBuilder.DropColumn(
                name: "rate_limit_reset_at",
                table: "api_keys");

            migrationBuilder.DropColumn(
                name: "requests_this_hour",
                table: "api_keys");
        }
    }
}
