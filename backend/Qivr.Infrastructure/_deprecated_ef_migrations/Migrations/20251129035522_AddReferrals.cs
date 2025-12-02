using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReferrals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "referrals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    referring_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    specialty = table.Column<string>(type: "text", nullable: false),
                    specific_service = table.Column<string>(type: "text", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    external_provider_name = table.Column<string>(type: "text", nullable: true),
                    external_provider_phone = table.Column<string>(type: "text", nullable: true),
                    external_provider_email = table.Column<string>(type: "text", nullable: true),
                    external_provider_address = table.Column<string>(type: "text", nullable: true),
                    external_provider_fax = table.Column<string>(type: "text", nullable: true),
                    reason_for_referral = table.Column<string>(type: "text", nullable: true),
                    clinical_history = table.Column<string>(type: "text", nullable: true),
                    current_medications = table.Column<string>(type: "text", nullable: true),
                    allergies = table.Column<string>(type: "text", nullable: true),
                    relevant_test_results = table.Column<string>(type: "text", nullable: true),
                    specific_questions = table.Column<string>(type: "text", nullable: true),
                    referral_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expiry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    scheduled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    response_notes = table.Column<string>(type: "text", nullable: true),
                    appointment_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    appointment_location = table.Column<string>(type: "text", nullable: true),
                    referral_document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    response_document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    internal_notes = table.Column<string>(type: "text", nullable: true),
                    patient_notified = table.Column<bool>(type: "boolean", nullable: false),
                    patient_notified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    requires_follow_up = table.Column<bool>(type: "boolean", nullable: false),
                    follow_up_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancellation_reason = table.Column<string>(type: "text", nullable: true),
                    cancelled_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_referrals", x => x.id);
                    table.ForeignKey(
                        name: "fk_referrals__users_cancelled_by_user_id",
                        column: x => x.cancelled_by_user_id,
                        principalTable: "users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_referrals__users_patient_id",
                        column: x => x.patient_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_referrals__users_referring_provider_id",
                        column: x => x.referring_provider_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_referrals_documents_referral_document_id",
                        column: x => x.referral_document_id,
                        principalTable: "documents",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_referrals_documents_response_document_id",
                        column: x => x.response_document_id,
                        principalTable: "documents",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_referrals_cancelled_by_user_id",
                table: "referrals",
                column: "cancelled_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_referrals_patient_id",
                table: "referrals",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_referrals_referral_document_id",
                table: "referrals",
                column: "referral_document_id");

            migrationBuilder.CreateIndex(
                name: "ix_referrals_referring_provider_id",
                table: "referrals",
                column: "referring_provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_referrals_response_document_id",
                table: "referrals",
                column: "response_document_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "referrals");
        }
    }
}
