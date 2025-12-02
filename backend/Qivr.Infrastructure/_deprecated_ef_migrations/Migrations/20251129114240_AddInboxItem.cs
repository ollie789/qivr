using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_check_in");

            migrationBuilder.AddColumn<string>(
                name: "CheckIns",
                table: "treatment_plans",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "inbox_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    item_type = table.Column<string>(type: "text", nullable: false),
                    message_id = table.Column<Guid>(type: "uuid", nullable: true),
                    document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    notification_id = table.Column<Guid>(type: "uuid", nullable: true),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: true),
                    preview = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    priority = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false),
                    archived_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_starred = table.Column<bool>(type: "boolean", nullable: false),
                    requires_action = table.Column<bool>(type: "boolean", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    from_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    from_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    labels = table.Column<string>(type: "jsonb", nullable: false),
                    Metadata = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inbox_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_inbox_items__messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_inbox_items__users_from_user_id",
                        column: x => x.from_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_inbox_items__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_inbox_items__users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_inbox_items_documents_document_id",
                        column: x => x.document_id,
                        principalTable: "documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_inbox_items_document_id",
                table: "inbox_items",
                column: "document_id");

            migrationBuilder.CreateIndex(
                name: "ix_inbox_items_from_user_id",
                table: "inbox_items",
                column: "from_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_inbox_items_message_id",
                table: "inbox_items",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "ix_inbox_items_patient_id",
                table: "inbox_items",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_inbox_items_tenant_id_user_id_status",
                table: "inbox_items",
                columns: new[] { "tenant_id", "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_inbox_items_user_id_received_at",
                table: "inbox_items",
                columns: new[] { "user_id", "received_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inbox_items");

            migrationBuilder.DropColumn(
                name: "CheckIns",
                table: "treatment_plans");

            migrationBuilder.CreateTable(
                name: "daily_check_in",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    continued_streak = table.Column<bool>(type: "boolean", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    exercises_assigned = table.Column<int>(type: "integer", nullable: false),
                    exercises_completed = table.Column<int>(type: "integer", nullable: false),
                    mood = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    pain_level = table.Column<int>(type: "integer", nullable: false),
                    points_earned = table.Column<int>(type: "integer", nullable: false),
                    treatment_plan_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_daily_check_in", x => x.id);
                    table.ForeignKey(
                        name: "fk_daily_check_in__treatment_plans_treatment_plan_id",
                        column: x => x.treatment_plan_id,
                        principalTable: "treatment_plans",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_daily_check_in_treatment_plan_id",
                table: "daily_check_in",
                column: "treatment_plan_id");
        }
    }
}
