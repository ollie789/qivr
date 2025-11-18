import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => {
  const mock = {
    get: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from "../../lib/api-client";
import {
  fetchMedicalSummary,
  fetchPainAssessments,
  fetchLabResults,
  fetchMedications,
  fetchAllergies,
  fetchImmunizations,
} from "../medicalRecordsApi";
import type {
  Allergy,
  Immunization,
  LabResult,
  Medication,
  PainAssessment,
} from "../../types";

const mockClient = vi.mocked(apiClient);

describe("medicalRecordsApi", () => {
  const painAssessments: PainAssessment[] = [
    {
      id: "p1",
      recordedAt: "2024-01-01",
      recordedBy: "Dr. Smith",
      overallPainLevel: 5,
      functionalImpact: "moderate",
      painPoints: [{ bodyPart: "Lower back", side: "bilateral", intensity: 6 }],
      evaluationId: null,
      notes: null,
      weightKg: 75,
      heightCm: 175,
      bmi: 24.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchMedicalSummary returns null when no data", async () => {
    mockClient.get.mockResolvedValueOnce({ data: null });

    const result = await fetchMedicalSummary();

    expect(mockClient.get).toHaveBeenCalledWith("/api/medical-records");
    expect(result).toBeNull();
  });

  it("fetchPainAssessments unwraps envelope", async () => {
    mockClient.get.mockResolvedValueOnce({ data: painAssessments });

    const result = await fetchPainAssessments();

    expect(mockClient.get).toHaveBeenCalledWith(
      "/api/medical-records/pain-assessments",
    );
    expect(result).toEqual(painAssessments);
  });

  it("fetchLabResults, fetchMedications, fetchAllergies, fetchImmunizations return plain values", async () => {
    const labResults: LabResult[] = [
      {
        id: "lab1",
        date: "2024-01-01",
        testName: "CBC",
        category: "blood",
        value: "Normal",
        unit: "",
        referenceRange: "Normal",
        status: "normal",
        provider: "Lab",
      },
    ];
    const medications: Medication[] = [
      {
        id: "med1",
        name: "Ibuprofen",
        dosage: "200mg",
        frequency: "Daily",
        startDate: "2024-01-01",
        prescribedBy: "Dr. House",
        status: "active",
      },
    ];
    const allergies: Allergy[] = [
      {
        id: "allergy1",
        allergen: "Peanuts",
        type: "food",
        severity: "severe",
        reaction: "Anaphylaxis",
      },
    ];
    const immunizations: Immunization[] = [
      {
        id: "imm1",
        vaccine: "Flu",
        date: "2023-10-01",
        provider: "Clinic",
        facility: "Main",
      },
    ];

    mockClient.get
      .mockResolvedValueOnce(labResults)
      .mockResolvedValueOnce(medications)
      .mockResolvedValueOnce(allergies)
      .mockResolvedValueOnce(immunizations);

    expect(await fetchLabResults()).toEqual(labResults);
    expect(await fetchMedications()).toEqual(medications);
    expect(await fetchAllergies()).toEqual(allergies);
    expect(await fetchImmunizations()).toEqual(immunizations);

    expect(mockClient.get).toHaveBeenNthCalledWith(
      1,
      "/api/medical-records/lab-results",
    );
    expect(mockClient.get).toHaveBeenNthCalledWith(
      2,
      "/api/medical-records/medications",
    );
    expect(mockClient.get).toHaveBeenNthCalledWith(
      3,
      "/api/medical-records/allergies",
    );
    expect(mockClient.get).toHaveBeenNthCalledWith(
      4,
      "/api/medical-records/immunizations",
    );
  });
});
