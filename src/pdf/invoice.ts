import PDFDocument from "pdfkit";
import fs from "fs";
import { formatUSD, formatDate } from "../utils/format";

// Fixed billing constants that appear in every invoice
const FIXED_RUT = "218873550019";
const FIXED_ADDRESS_LINE = "Avda. Luis Alberto de Herrera 1248, Piso 12, Montevideo, ROU";

export interface InvoiceOptions {
  cliente: string;
  billTo: string;
  amount: number;
  name: string;
  rut: string;
  clientAddress: string;
  invoiceNo: string;
  period: string;
  address?: string;
  phone?: string;
  date?: string;
  serviceCountry?: string;
  absenceDays?: number[];
  outPath: string;
}

// Color palette
const COLOR_GRAY_BG = "#4a4a4a";
const COLOR_LIGHT_BLUE_BG = "#d6eaf8";
const COLOR_BLACK = "#000000";
const COLOR_WHITE = "#ffffff";
const COLOR_LIGHT_GRAY_LINE = "#cccccc";

export function generateInvoice(opts: InvoiceOptions): void {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Invoice ${opts.invoiceNo}`,
      Author: opts.name,
      CreationDate: new Date(opts.date ?? new Date().toISOString().slice(0, 10)),
    },
  });

  const stream = fs.createWriteStream(opts.outPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;   // 595.28
  const pageHeight = doc.page.height; // 841.89
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  // ─── HEADER SECTION ────────────────────────────────────────────────────────

  // Large "INVOICE" title – top right
  doc
    .font("Helvetica-Bold")
    .fontSize(38)
    .fillColor(COLOR_BLACK)
    .text("INVOICE", margin, 45, {
      width: contentWidth,
      align: "right",
    });

  // Top-left block: sender info
  const leftStartY = 45;
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLOR_BLACK)
    .text(opts.cliente, margin, leftStartY, { lineGap: 2 });

  let leftY = leftStartY + 18;

  doc.font("Helvetica").fontSize(9).fillColor("#333333");

  if (opts.address) {
    doc.text(`Address: ${opts.address}`, margin, leftY, { lineGap: 2 });
    leftY += 14;
  } else {
    doc.text("Address:", margin, leftY, { lineGap: 2 });
    leftY += 14;
  }

  if (opts.phone) {
    doc.text(`Phone: ${opts.phone}`, margin, leftY, { lineGap: 2 });
    leftY += 14;
  } else {
    doc.text("Phone:", margin, leftY, { lineGap: 2 });
    leftY += 14;
  }

  // Top-right: date & invoice number (below the INVOICE title)
  const rightColX = pageWidth / 2 + 20;
  const rightColWidth = pageWidth - margin - rightColX;
  const dateStr = formatDate(opts.date);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#333333")
    .text(`DATE: ${dateStr}`, rightColX, leftStartY + 48, {
      width: rightColWidth,
      align: "left",
    });

  doc.text(`INVOICE # ${opts.invoiceNo}`, rightColX, leftStartY + 62, {
    width: rightColWidth,
    align: "left",
  });

  // ─── DIVIDER ───────────────────────────────────────────────────────────────

  const dividerY = Math.max(leftY, leftStartY + 82) + 10;

  doc
    .moveTo(margin, dividerY)
    .lineTo(pageWidth - margin, dividerY)
    .strokeColor(COLOR_LIGHT_GRAY_LINE)
    .lineWidth(1)
    .stroke();

  // ─── BILL TO SECTION ───────────────────────────────────────────────────────

  const billToY = dividerY + 16;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLOR_BLACK)
    .text("Bill To:", margin, billToY);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLOR_BLACK)
    .text(opts.billTo, margin, billToY + 16, { lineGap: 2 });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#333333")
    .text(`RUT: ${opts.rut}`, margin, billToY + 32, { lineGap: 2 });

  doc.text(`Client Address: ${opts.clientAddress}`, margin, billToY + 46, {
    width: contentWidth / 2,
    lineGap: 2,
  });

  // ─── TABLE ─────────────────────────────────────────────────────────────────

  const tableTopY = billToY + 90;
  const tableLeft = margin;
  const tableRight = pageWidth - margin;
  const tableWidth = tableRight - tableLeft;

  // Column widths: description ~70%, amount ~30%
  const descColWidth = Math.floor(tableWidth * 0.70);
  const amtColWidth = tableWidth - descColWidth;

  const amtColX = tableLeft + descColWidth;

  // Header row
  const headerH = 24;
  doc
    .rect(tableLeft, tableTopY, descColWidth, headerH)
    .fill(COLOR_GRAY_BG);
  doc
    .rect(amtColX, tableTopY, amtColWidth, headerH)
    .fill(COLOR_GRAY_BG);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLOR_WHITE)
    .text("DESCRIPTION", tableLeft + 8, tableTopY + 7, {
      width: descColWidth - 16,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLOR_WHITE)
    .text("AMOUNT", amtColX + 8, tableTopY + 7, {
      width: amtColWidth - 16,
      align: "center",
    });

  // Description body row
  const bodyTopY = tableTopY + headerH;

  // Build description lines
  const descLines: string[] = [];
  if (opts.serviceCountry) {
    descLines.push(`Modulos desarrollados 100% en (${opts.serviceCountry})`);
  } else {
    descLines.push("Modulos desarrollados 100%");
  }
  if (opts.absenceDays && opts.absenceDays.length > 0) {
    const month = opts.period.slice(0, 3);
    descLines.push(`Ausencias ${month} (días): ${opts.absenceDays.join(", ")}`);
  }

  // Measure height needed for description cell
  const lineHeight = 14;
  const cellPadY = 10;
  const descBodyH = Math.max(44, cellPadY * 2 + descLines.length * lineHeight);

  // Draw description cell border
  doc
    .rect(tableLeft, bodyTopY, descColWidth, descBodyH)
    .strokeColor(COLOR_LIGHT_GRAY_LINE)
    .lineWidth(0.5)
    .stroke();

  // Draw amount cell border
  doc
    .rect(amtColX, bodyTopY, amtColWidth, descBodyH)
    .strokeColor(COLOR_LIGHT_GRAY_LINE)
    .lineWidth(0.5)
    .stroke();

  // Description text
  let descTextY = bodyTopY + cellPadY;
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_BLACK);
  for (const line of descLines) {
    doc.text(line, tableLeft + 8, descTextY, {
      width: descColWidth - 16,
      lineGap: 2,
    });
    descTextY += lineHeight;
  }

  // Amount cell – left blank (amount only shown in TOTAL row)
  // (intentionally empty per layout)

  // Total row
  const totalRowY = bodyTopY + descBodyH;
  const totalRowH = 28;

  // Left cell: "TOTAL" label
  doc
    .rect(tableLeft, totalRowY, descColWidth, totalRowH)
    .strokeColor(COLOR_LIGHT_GRAY_LINE)
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLOR_BLACK)
    .text("TOTAL", tableLeft + 8, totalRowY + 8, {
      width: descColWidth - 16,
    });

  // Right cell: light blue background with USD amount
  doc
    .rect(amtColX, totalRowY, amtColWidth, totalRowH)
    .fill(COLOR_LIGHT_BLUE_BG);

  doc
    .rect(amtColX, totalRowY, amtColWidth, totalRowH)
    .strokeColor(COLOR_LIGHT_GRAY_LINE)
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLOR_BLACK)
    .text(formatUSD(opts.amount), amtColX + 8, totalRowY + 8, {
      width: amtColWidth - 16,
      align: "center",
    });

  // ─── FOOTER ────────────────────────────────────────────────────────────────

  const footerY = pageHeight - 40;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#999999")
    .text(
      `${opts.name}  ·  ${opts.period}  ·  ${opts.invoiceNo}`,
      margin,
      footerY,
      { width: contentWidth, align: "center" }
    );

  doc.end();

  stream.on("error", (err) => {
    throw err;
  });
}
