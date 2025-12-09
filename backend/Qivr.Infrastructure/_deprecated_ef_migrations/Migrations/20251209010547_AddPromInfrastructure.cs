using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qivr.Infrastructure._deprecated_ef_migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddPromInfrastructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "frequency_hint",
                table: "prom_templates",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "instrument_id",
                table: "prom_templates",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "schema_version",
                table: "prom_templates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string[]>(
                name: "tags",
                table: "prom_templates",
                type: "text[]",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "instruments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    instrument_family = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    clinical_domain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    license_type = table.Column<string>(type: "text", nullable: false),
                    license_notes = table.Column<string>(type: "text", nullable: true),
                    is_global = table.Column<bool>(type: "boolean", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    reference_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_instruments", x => x.id);
                    table.ForeignKey(
                        name: "fk_instruments__tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "summary_score_definitions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    score_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    scoring_method = table.Column<string>(type: "text", nullable: false),
                    range_min = table.Column<decimal>(type: "numeric", nullable: false),
                    range_max = table.Column<decimal>(type: "numeric", nullable: false),
                    higher_is_better = table.Column<bool>(type: "boolean", nullable: false),
                    population_mean = table.Column<decimal>(type: "numeric", nullable: true),
                    population_std_dev = table.Column<decimal>(type: "numeric", nullable: true),
                    InterpretationBands = table.Column<string>(type: "text", nullable: true),
                    mcid = table.Column<decimal>(type: "numeric", nullable: true),
                    order_index = table.Column<int>(type: "integer", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_summary_score_definitions", x => x.id);
                    table.ForeignKey(
                        name: "fk_summary_score_definitions_prom_templates_template_id",
                        column: x => x.template_id,
                        principalTable: "prom_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "template_questions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    label = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    question_text = table.Column<string>(type: "text", nullable: true),
                    question_type = table.Column<string>(type: "text", nullable: false),
                    section = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    order_index = table.Column<int>(type: "integer", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: true),
                    is_scored = table.Column<bool>(type: "boolean", nullable: false),
                    score_weight = table.Column<decimal>(type: "numeric", nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    min_score = table.Column<decimal>(type: "numeric", nullable: true),
                    max_score = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_template_questions", x => x.id);
                    table.ForeignKey(
                        name: "fk_template_questions_prom_templates_template_id",
                        column: x => x.template_id,
                        principalTable: "prom_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prom_summary_scores",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    definition_id = table.Column<Guid>(type: "uuid", nullable: true),
                    score_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    value = table.Column<decimal>(type: "numeric", nullable: false),
                    raw_value = table.Column<decimal>(type: "numeric", nullable: true),
                    range_min = table.Column<decimal>(type: "numeric", nullable: true),
                    range_max = table.Column<decimal>(type: "numeric", nullable: true),
                    higher_is_better = table.Column<bool>(type: "boolean", nullable: true),
                    interpretation_band = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    item_count = table.Column<int>(type: "integer", nullable: true),
                    missing_item_count = table.Column<int>(type: "integer", nullable: true),
                    confidence_interval_lower = table.Column<decimal>(type: "numeric", nullable: true),
                    confidence_interval_upper = table.Column<decimal>(type: "numeric", nullable: true),
                    has_floor_effect = table.Column<bool>(type: "boolean", nullable: false),
                    has_ceiling_effect = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_summary_scores", x => x.id);
                    table.ForeignKey(
                        name: "fk_prom_summary_scores__summary_score_definitions_definition_id",
                        column: x => x.definition_id,
                        principalTable: "summary_score_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_prom_summary_scores_prom_instances_instance_id",
                        column: x => x.instance_id,
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prom_item_responses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    value_raw = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    value_numeric = table.Column<decimal>(type: "numeric", nullable: true),
                    value_display = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    multi_select_values = table.Column<string>(type: "text", nullable: true),
                    is_skipped = table.Column<bool>(type: "boolean", nullable: false),
                    response_time_seconds = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prom_item_responses", x => x.id);
                    table.ForeignKey(
                        name: "fk_prom_item_responses__template_questions_template_question_id",
                        column: x => x.template_question_id,
                        principalTable: "template_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prom_item_responses_prom_instances_instance_id",
                        column: x => x.instance_id,
                        principalTable: "prom_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "summary_score_question_mappings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    summary_score_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    weight = table.Column<decimal>(type: "numeric", nullable: false),
                    is_reverse_scored = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_summary_score_question_mappings", x => x.id);
                    table.ForeignKey(
                        name: "fk_summary_score_question_mappings__template_questions_template_~",
                        column: x => x.template_question_id,
                        principalTable: "template_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_summary_score_question_mappings_summary_score_definitions_s~",
                        column: x => x.summary_score_definition_id,
                        principalTable: "summary_score_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_prom_templates_instrument_id",
                table: "prom_templates",
                column: "instrument_id");

            migrationBuilder.CreateIndex(
                name: "IX_instruments_clinical_domain",
                table: "instruments",
                column: "clinical_domain");

            migrationBuilder.CreateIndex(
                name: "IX_instruments_key",
                table: "instruments",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_instruments_tenant_id_is_global",
                table: "instruments",
                columns: new[] { "tenant_id", "is_global" });

            migrationBuilder.CreateIndex(
                name: "IX_prom_item_responses_instance_id_template_question_id",
                table: "prom_item_responses",
                columns: new[] { "instance_id", "template_question_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_prom_item_responses_question_code",
                table: "prom_item_responses",
                column: "question_code");

            migrationBuilder.CreateIndex(
                name: "ix_prom_item_responses_template_question_id",
                table: "prom_item_responses",
                column: "template_question_id");

            migrationBuilder.CreateIndex(
                name: "IX_prom_item_responses_tenant_id_question_code_created_at",
                table: "prom_item_responses",
                columns: new[] { "tenant_id", "question_code", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_prom_summary_scores_definition_id",
                table: "prom_summary_scores",
                column: "definition_id");

            migrationBuilder.CreateIndex(
                name: "IX_prom_summary_scores_instance_id_score_key",
                table: "prom_summary_scores",
                columns: new[] { "instance_id", "score_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_prom_summary_scores_tenant_id_score_key_created_at",
                table: "prom_summary_scores",
                columns: new[] { "tenant_id", "score_key", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_summary_score_definitions_template_id_order_index",
                table: "summary_score_definitions",
                columns: new[] { "template_id", "order_index" });

            migrationBuilder.CreateIndex(
                name: "IX_summary_score_definitions_template_id_score_key",
                table: "summary_score_definitions",
                columns: new[] { "template_id", "score_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_summary_score_question_mappings_summary_score_definition_id~",
                table: "summary_score_question_mappings",
                columns: new[] { "summary_score_definition_id", "template_question_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_summary_score_question_mappings_template_question_id",
                table: "summary_score_question_mappings",
                column: "template_question_id");

            migrationBuilder.CreateIndex(
                name: "IX_template_questions_code",
                table: "template_questions",
                column: "code");

            migrationBuilder.CreateIndex(
                name: "IX_template_questions_section",
                table: "template_questions",
                column: "section");

            migrationBuilder.CreateIndex(
                name: "IX_template_questions_template_id_order_index",
                table: "template_questions",
                columns: new[] { "template_id", "order_index" });

            migrationBuilder.CreateIndex(
                name: "IX_template_questions_template_id_question_key",
                table: "template_questions",
                columns: new[] { "template_id", "question_key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_prom_templates_instruments_instrument_id",
                table: "prom_templates",
                column: "instrument_id",
                principalTable: "instruments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_prom_templates_instruments_instrument_id",
                table: "prom_templates");

            migrationBuilder.DropTable(
                name: "instruments");

            migrationBuilder.DropTable(
                name: "prom_item_responses");

            migrationBuilder.DropTable(
                name: "prom_summary_scores");

            migrationBuilder.DropTable(
                name: "summary_score_question_mappings");

            migrationBuilder.DropTable(
                name: "template_questions");

            migrationBuilder.DropTable(
                name: "summary_score_definitions");

            migrationBuilder.DropIndex(
                name: "ix_prom_templates_instrument_id",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "frequency_hint",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "instrument_id",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "schema_version",
                table: "prom_templates");

            migrationBuilder.DropColumn(
                name: "tags",
                table: "prom_templates");
        }
    }
}
