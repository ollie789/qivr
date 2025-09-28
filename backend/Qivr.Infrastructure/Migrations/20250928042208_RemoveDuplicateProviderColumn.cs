using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDuplicateProviderColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments_clinics_clinic_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_providers_provider_id",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "ix_appointments_provider_id1",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "provider_id1",
                table: "appointments");

            migrationBuilder.AddColumn<Guid>(
                name: "clinic_id1",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_appointments_clinic_id1",
                table: "appointments",
                column: "clinic_id1");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_clinics_clinic_id",
                table: "appointments",
                column: "clinic_id",
                principalTable: "clinics",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_clinics_clinic_id1",
                table: "appointments",
                column: "clinic_id1",
                principalTable: "clinics",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments_clinics_clinic_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_clinics_clinic_id1",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "ix_appointments_clinic_id1",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "clinic_id1",
                table: "appointments");

            migrationBuilder.AddColumn<Guid>(
                name: "provider_id1",
                table: "appointments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "ix_appointments_provider_id1",
                table: "appointments",
                column: "provider_id1");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_clinics_clinic_id",
                table: "appointments",
                column: "clinic_id",
                principalTable: "clinics",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_providers_provider_id",
                table: "appointments",
                column: "provider_id1",
                principalTable: "providers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
