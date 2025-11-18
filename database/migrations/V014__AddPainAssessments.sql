-- Add pain assessments table for allied health tracking
CREATE TABLE IF NOT EXISTS "PainAssessments" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "TenantId" uuid NOT NULL,
    "PatientId" uuid NOT NULL,
    "EvaluationId" uuid NULL,
    "RecordedAt" timestamp with time zone NOT NULL,
    "RecordedBy" text NOT NULL,
    "OverallPainLevel" integer NOT NULL DEFAULT 0,
    "FunctionalImpact" text NOT NULL DEFAULT 'none',
    "PainPointsJson" text NULL,
    "Notes" text NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_PainAssessments_Tenants" FOREIGN KEY ("TenantId") REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PainAssessments_Users_Patient" FOREIGN KEY ("PatientId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX "IX_PainAssessments_TenantId" ON "PainAssessments" ("TenantId");
CREATE INDEX "IX_PainAssessments_PatientId" ON "PainAssessments" ("PatientId");
CREATE INDEX "IX_PainAssessments_RecordedAt" ON "PainAssessments" ("RecordedAt" DESC);
CREATE INDEX "IX_PainAssessments_EvaluationId" ON "PainAssessments" ("EvaluationId") WHERE "EvaluationId" IS NOT NULL;

-- Add allied health fields to MedicalConditions
ALTER TABLE "MedicalConditions" 
ADD COLUMN IF NOT EXISTS "AffectedArea" text NULL,
ADD COLUMN IF NOT EXISTS "OnsetType" text NULL,
ADD COLUMN IF NOT EXISTS "PreviousTreatments" text NULL,
ADD COLUMN IF NOT EXISTS "AggravatingFactors" text NULL,
ADD COLUMN IF NOT EXISTS "RelievingFactors" text NULL;

-- Add comment
COMMENT ON TABLE "PainAssessments" IS 'Pain assessments for allied health practices (physio, chiro, etc.)';
COMMENT ON COLUMN "PainAssessments"."OverallPainLevel" IS 'Pain level on 0-10 scale';
COMMENT ON COLUMN "PainAssessments"."FunctionalImpact" IS 'Impact on daily function: none, mild, moderate, severe';
COMMENT ON COLUMN "PainAssessments"."PainPointsJson" IS 'JSON array of specific pain points with body part, side, intensity, quality';
