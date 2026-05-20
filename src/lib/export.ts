import type { RefObject } from "react";

export async function exportToPDF(ref: RefObject<HTMLDivElement | null>) {
  if (!ref.current) return;

  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  const imgWidth = pageWidth;
  const imgHeight = imgWidth / ratio;

  let yPos = 0;
  let remaining = imgHeight;

  while (remaining > 0) {
    pdf.addImage(imgData, "PNG", 0, -yPos, imgWidth, imgHeight);
    remaining -= pageHeight;
    yPos += pageHeight;
    if (remaining > 0) pdf.addPage();
  }

  pdf.save("meeting-insights.pdf");
}
