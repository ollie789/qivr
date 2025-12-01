import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { DeviceOutcomeSummaryResponse } from "../types/outcomes";

interface ReportOptions {
  deviceSummary: DeviceOutcomeSummaryResponse;
  partnerName: string;
  chartElement?: HTMLElement | null;
}

export async function generateDeviceOutcomeReport(
  options: ReportOptions,
): Promise<void> {
  const { deviceSummary, partnerName, chartElement } = options;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Device Outcome Report", 20, 25);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(partnerName, 20, 35);

  // Report date
  pdf.setFontSize(10);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageWidth - 70,
    35,
  );

  yPos = 55;

  // Device Info Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(deviceSummary.deviceName, 20, yPos);
  yPos += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Device Code: ${deviceSummary.deviceCode}`, 20, yPos);
  yPos += 5;

  if (deviceSummary.category) {
    pdf.text(`Category: ${deviceSummary.category}`, 20, yPos);
    yPos += 5;
  }
  if (deviceSummary.bodyRegion) {
    pdf.text(`Body Region: ${deviceSummary.bodyRegion}`, 20, yPos);
    yPos += 5;
  }

  yPos += 10;

  // Summary Statistics
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Summary Statistics", 20, yPos);
  yPos += 10;

  // Stats boxes
  // Calculate average improvement from promTypeStats
  const avgImprovement =
    deviceSummary.promTypeStats.length > 0
      ? deviceSummary.promTypeStats.reduce(
          (sum, s) => sum + s.percentImprovement,
          0,
        ) / deviceSummary.promTypeStats.length
      : null;

  const statsData = [
    {
      label: "Total Patients",
      value: deviceSummary.patientCount.toLocaleString(),
    },
    {
      label: "Total Procedures",
      value: deviceSummary.procedureCount.toLocaleString(),
    },
    {
      label: "Avg Improvement",
      value: avgImprovement ? `${avgImprovement.toFixed(1)}%` : "N/A",
    },
    {
      label: "PROM Responses",
      value: deviceSummary.promResponseCount.toLocaleString(),
    },
  ];

  const boxWidth = 40;
  const boxHeight = 25;
  const startX = 20;

  statsData.forEach((stat, i) => {
    const x = startX + i * (boxWidth + 5);

    // Box background
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, "F");

    // Label
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(stat.label, x + 3, yPos + 8);

    // Value
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(stat.value, x + 3, yPos + 20);
  });

  yPos += boxHeight + 15;

  // Outcome Scores Section by PROM Type
  if (deviceSummary.promTypeStats.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Outcome Scores by PROM Type", 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    for (const stat of deviceSummary.promTypeStats) {
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${stat.promName} (${stat.promType})`, 25, yPos);
      yPos += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Baseline: ${stat.baselineAverageScore.toFixed(1)} (n=${stat.baselineCount})`,
        30,
        yPos,
      );
      yPos += 5;

      const followUp =
        stat.followUpAverageScore || stat.finalOutcomeAverageScore;
      const followUpN = stat.followUpCount + stat.finalOutcomeCount;
      pdf.text(`Follow-up: ${followUp.toFixed(1)} (n=${followUpN})`, 30, yPos);
      yPos += 5;

      if (stat.percentImprovement > 0) {
        pdf.setTextColor(34, 197, 94); // green-500
        pdf.text(
          `Improvement: ${stat.percentImprovement.toFixed(1)}%`,
          30,
          yPos,
        );
      } else if (stat.percentImprovement < 0) {
        pdf.setTextColor(239, 68, 68); // red-500
        pdf.text(
          `Decline: ${Math.abs(stat.percentImprovement).toFixed(1)}%`,
          30,
          yPos,
        );
      } else {
        pdf.setTextColor(100, 100, 100);
        pdf.text(`No change`, 30, yPos);
      }
      yPos += 8;
    }
    yPos += 5;
  }

  // Chart capture
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        logging: false,
      } as Parameters<typeof html2canvas>[1]);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if we need a new page
      if (yPos + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Outcome Timeline", 20, yPos);
      yPos += 10;

      pdf.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 15;
    } catch (err) {
      console.error("Failed to capture chart:", err);
    }
  }

  // Footer
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(241, 245, 249);
  pdf.rect(0, pageHeight - 20, pageWidth, 20, "F");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    "This report contains de-identified, aggregated data protected by K-anonymity (minimum 5 patients).",
    20,
    pageHeight - 10,
  );
  pdf.text("QIVR Partner Portal", pageWidth - 45, pageHeight - 10);

  // Save
  const fileName = `${deviceSummary.deviceCode}-outcome-report-${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}
