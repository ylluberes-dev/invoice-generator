#!/usr/bin/env node
/**
 * invoicegen – CLI entry point.
 * No database, no network calls, no hidden file writes.
 */

import { Command } from "commander";
import fs from "fs";
import path from "path";
import {
  parsePeriod,
  parseAbsenceDays,
  invoiceFilename,
  reportFilename,
} from "./utils/format";
import { generateInvoice } from "./pdf/invoice";
import { generateReport } from "./pdf/report";

const program = new Command();

program
  .name("invoicegen")
  .description("Generate invoice and activity report PDFs. No network calls. No data storage.")
  .version("1.0.0")
  .requiredOption("--cliente <string>", "Legal name of the client company")
  .requiredOption("--bill-to <string>", "Company name shown in the Bill To section of the invoice")
  .requiredOption("--amount <number>", "Invoice amount in USD (must be > 0)")
  .requiredOption("--name <string>", 'Your full name, e.g. "Carlos Perez"')
  .requiredOption("--rut <string>", "RUT of the client company")
  .requiredOption("--client-address <string>", "Address of the client company")
  .requiredOption("--invoice-no <string>", 'Invoice identifier, e.g. "invoice3"')
  .requiredOption("--period <string>", 'Billing period, e.g. "feb2026"')
  .option("--address <string>", "Your address (shown top-left of invoice)")
  .option("--phone <string>", "Your phone number (shown top-left of invoice)")
  .option("--date <YYYY-MM-DD>", "Invoice date (defaults to today if omitted)")
  .option("--report <path>", "Path to a .txt file for the activity report PDF")
  .option("--absence-days <csv>", 'Comma-separated absence day numbers 1-31, e.g. "1,2,15"')
  .option("--country <string>", "Country where services were delivered")
  .option("--out-dir <path>", "Output directory for generated PDFs", "./out");

program.parse(process.argv);

const opts = program.opts<{
  cliente: string;
  billTo: string;
  amount: string;
  name: string;
  rut: string;
  clientAddress: string;
  invoiceNo: string;
  period: string;
  address?: string;
  phone?: string;
  date?: string;
  report?: string;
  absenceDays?: string;
  country?: string;
  outDir: string;
}>();

// ─── VALIDATION ──────────────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

const amount = parseFloat(opts.amount);
if (isNaN(amount) || amount <= 0) {
  fail("--amount must be a positive number greater than 0.");
}

let period: string;
try {
  period = parsePeriod(opts.period.toLowerCase());
} catch (e) {
  fail((e as Error).message);
}

let absenceDays: number[] | undefined;
if (opts.absenceDays) {
  try {
    absenceDays = parseAbsenceDays(opts.absenceDays);
  } catch (e) {
    fail((e as Error).message);
  }
}

if (opts.date && !/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) {
  fail("--date must be in YYYY-MM-DD format.");
}

let reportText: string | undefined;
if (opts.report) {
  const reportPath = path.resolve(opts.report);
  if (!fs.existsSync(reportPath)) {
    fail(`--report file not found: ${reportPath}`);
  }
  if (path.extname(reportPath).toLowerCase() !== ".txt") {
    fail("--report must point to a .txt file.");
  }
  reportText = fs.readFileSync(reportPath, "utf-8");
}

// ─── OUTPUT PATHS ────────────────────────────────────────────────────────────

const outDir = path.resolve(opts.outDir);
const invoiceOutPath = path.join(outDir, invoiceFilename(period, opts.invoiceNo, opts.name));
const reportOutPath = path.join(outDir, reportFilename(period, opts.name));

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// ─── GENERATE INVOICE ────────────────────────────────────────────────────────

try {
  generateInvoice({
    cliente: opts.cliente,
    billTo: opts.billTo,
    amount,
    name: opts.name,
    rut: opts.rut,
    clientAddress: opts.clientAddress,
    invoiceNo: opts.invoiceNo,
    period,
    address: opts.address,
    phone: opts.phone,
    date: opts.date,
    serviceCountry: opts.country,
    absenceDays,
    outPath: invoiceOutPath,
  });
  console.log(`Invoice generated : ${invoiceOutPath}`);
} catch (e) {
  fail(`Failed to generate invoice PDF: ${(e as Error).message}`);
}

// ─── GENERATE REPORT (OPTIONAL) ──────────────────────────────────────────────

if (reportText !== undefined) {
  try {
    generateReport({
      cliente: opts.cliente,
      name: opts.name,
      period,
      reportText,
      outPath: reportOutPath,
      date: opts.date,
    });
    console.log(`Report generated  : ${reportOutPath}`);
  } catch (e) {
    fail(`Failed to generate report PDF: ${(e as Error).message}`);
  }
}
