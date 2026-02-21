import PDFDocument from "pdfkit";
import fs from "fs";

export interface ReportOptions {
  cliente: string;
  name: string;
  period: string;
  reportText: string;
  outPath: string;
  date?: string;
}

const COLOR_BLUE_TITLE = "#1a5276";
const COLOR_BLUE_PARTNER = "#1a6fa5";
const COLOR_BLACK = "#000000";
const COLOR_DARK_GRAY = "#333333";
const COLOR_RULE = "#aaaaaa";

export function generateReport(opts: ReportOptions): void {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Reporte de Actividades – ${opts.period}`,
      Author: opts.name,
    },
  });

  const stream = fs.createWriteStream(opts.outPath);
  doc.pipe(stream);

  const margin = 55;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - margin * 2;

  // ─── TITLE ─────────────────────────────────────────────────────────────────
  // "Reporte de Actividades – Partner " (plain blue) + cliente (bold blue)
  // We render them on the same baseline using two consecutive text calls.

  const titleY = 60;
  const titleFontSize = 18;

  const prefixText = "Reporte de Actividades \u2013 Partner ";

  doc
    .font("Helvetica")
    .fontSize(titleFontSize)
    .fillColor(COLOR_BLUE_TITLE)
    .text(prefixText, margin, titleY, { continued: true, lineGap: 0 });

  doc
    .font("Helvetica-Bold")
    .fontSize(titleFontSize)
    .fillColor(COLOR_BLUE_PARTNER)
    .text(opts.cliente, { lineGap: 0 });

  // Horizontal rule under title
  const ruleY = titleY + titleFontSize + 12;
  doc
    .moveTo(margin, ruleY)
    .lineTo(pageWidth - margin, ruleY)
    .strokeColor(COLOR_RULE)
    .lineWidth(1)
    .stroke();

  // ─── PERIOD ────────────────────────────────────────────────────────────────

  const periodY = ruleY + 18;
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLOR_DARK_GRAY)
    .text("Periodo: ", margin, periodY, { continued: true });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(COLOR_BLACK)
    .text(opts.period);

  // ─── META FIELDS ───────────────────────────────────────────────────────────

  const metaStartY = periodY + 32;
  const labelFontSize = 10;
  const labelLineGap = 10;

  const fields: Array<[string, string]> = [
    ["Recurso:", opts.name],
    ["Proyecto:", opts.cliente],
    ["Cliente:", opts.cliente],
  ];

  let metaY = metaStartY;
  for (const [label, value] of fields) {
    doc
      .font("Helvetica-Bold")
      .fontSize(labelFontSize)
      .fillColor(COLOR_DARK_GRAY)
      .text(label, margin, metaY, { continued: true });

    doc
      .font("Helvetica")
      .fontSize(labelFontSize)
      .fillColor(COLOR_BLACK)
      .text(` ${value}`);

    metaY += labelFontSize + labelLineGap;
  }

  // ─── SECTION HEADER: Desglose de Actividades ───────────────────────────────

  const sectionY = metaY + 24;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLOR_BLUE_TITLE)
    .text("Desglose de Actividades", margin, sectionY);

  // Underline the section header
  const sectionHeaderWidth = doc.widthOfString("Desglose de Actividades");
  const underlineY = sectionY + 16;
  doc
    .moveTo(margin, underlineY)
    .lineTo(margin + sectionHeaderWidth, underlineY)
    .strokeColor(COLOR_BLUE_TITLE)
    .lineWidth(1)
    .stroke();

  // ─── REPORT BODY ───────────────────────────────────────────────────────────

  const bodyY = underlineY + 16;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLOR_BLACK)
    .text(opts.reportText, margin, bodyY, {
      width: contentWidth,
      align: "left",
      lineGap: 3,
    });

  // ─── FOOTER on each page ───────────────────────────────────────────────────

  const totalPages = doc.bufferedPageRange().count;
  const footerFontSize = 7;
  const footerColor = "#aaaaaa";

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 30;
    doc
      .font("Helvetica")
      .fontSize(footerFontSize)
      .fillColor(footerColor)
      .text(
        `${opts.name}  ·  ${opts.period}  ·  ${opts.cliente}  ·  Página ${i + 1} de ${totalPages}`,
        margin,
        footerY,
        { width: pageWidth - margin * 2, align: "center" }
      );
  }

  doc.end();

  stream.on("error", (err) => {
    throw err;
  });
}
