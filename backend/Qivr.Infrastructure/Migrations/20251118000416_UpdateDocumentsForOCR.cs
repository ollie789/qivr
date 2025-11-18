using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDocumentsForOCR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "city",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "country",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "description",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "email",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "phone",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "state",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "zip_code",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "clinic_id",
                table: "providers");

            migrationBuilder.DropColumn(
                name: "content_type",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "description",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "is_archived",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "is_confidential",
                table: "documents");

            migrationBuilder.RenameColumn(
                name: "storage_path",
                table: "documents",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "reviewed_by",
                table: "documents",
                newName: "assigned_to");

            migrationBuilder.RenameColumn(
                name: "reviewed_at",
                table: "documents",
                newName: "ocr_completed_at");

            migrationBuilder.RenameColumn(
                name: "requires_review",
                table: "documents",
                newName: "is_urgent");

            migrationBuilder.RenameColumn(
                name: "metadata",
                table: "documents",
                newName: "s3key");

            migrationBuilder.RenameColumn(
                name: "file_size_bytes",
                table: "documents",
                newName: "file_size");

            migrationBuilder.RenameColumn(
                name: "archived_at",
                table: "documents",
                newName: "extracted_dob");

            migrationBuilder.AlterColumn<Guid>(
                name: "uploaded_by",
                table: "documents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<List<string>>(
                name: "tags",
                table: "documents",
                type: "text[]",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "file_name",
                table: "documents",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "document_type",
                table: "documents",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<decimal>(
                name: "confidence_score",
                table: "documents",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "due_date",
                table: "documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "extracted_identifiers",
                table: "documents",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "extracted_patient_name",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "extracted_text",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mime_type",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "s3bucket",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "document_audit_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    ip_address = table.Column<string>(type: "text", nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_document_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_document_audit_logs_documents_document_id",
                        column: x => x.document_id,
                        principalTable: "documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_document_audit_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_documents_assigned_to",
                table: "documents",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "ix_documents_uploaded_by",
                table: "documents",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "ix_document_audit_logs_document_id",
                table: "document_audit_log",
                column: "document_id");

            migrationBuilder.CreateIndex(
                name: "ix_document_audit_logs_user_id",
                table: "document_audit_log",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_documents_users_assigned_to_user_id",
                table: "documents",
                column: "assigned_to",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_documents_users_uploaded_by_user_id",
                table: "documents",
                column: "uploaded_by",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_documents_users_assigned_to_user_id",
                table: "documents");

            migrationBuilder.DropForeignKey(
                name: "fk_documents_users_uploaded_by_user_id",
                table: "documents");

            migrationBuilder.DropTable(
                name: "document_audit_log");

            migrationBuilder.DropIndex(
                name: "ix_documents_assigned_to",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "ix_documents_uploaded_by",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "confidence_score",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "due_date",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "extracted_identifiers",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "extracted_patient_name",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "extracted_text",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "mime_type",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "s3bucket",
                table: "documents");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "documents",
                newName: "storage_path");

            migrationBuilder.RenameColumn(
                name: "s3key",
                table: "documents",
                newName: "metadata");

            migrationBuilder.RenameColumn(
                name: "ocr_completed_at",
                table: "documents",
                newName: "reviewed_at");

            migrationBuilder.RenameColumn(
                name: "is_urgent",
                table: "documents",
                newName: "requires_review");

            migrationBuilder.RenameColumn(
                name: "file_size",
                table: "documents",
                newName: "file_size_bytes");

            migrationBuilder.RenameColumn(
                name: "extracted_dob",
                table: "documents",
                newName: "archived_at");

            migrationBuilder.RenameColumn(
                name: "assigned_to",
                table: "documents",
                newName: "reviewed_by");

            migrationBuilder.AddColumn<string>(
                name: "address",
                table: "tenants",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "city",
                table: "tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "country",
                table: "tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "tenants",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "tenants",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "phone",
                table: "tenants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "state",
                table: "tenants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "zip_code",
                table: "tenants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "clinic_id",
                table: "providers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "uploaded_by",
                table: "documents",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "tags",
                table: "documents",
                type: "text",
                nullable: false,
                oldClrType: typeof(List<string>),
                oldType: "text[]");

            migrationBuilder.AlterColumn<string>(
                name: "file_name",
                table: "documents",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "document_type",
                table: "documents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "content_type",
                table: "documents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "documents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "is_archived",
                table: "documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_confidential",
                table: "documents",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
