# invoicegen

CLI tool that generates invoice and activity report PDFs from the command line.

No network calls. No database. Only the requested PDFs are written to disk.

---

## Install & Build

```bash
git clone https://github.com/ylluberes-dev/invoice-generator.git
cd invoice-tool
npm install
npm run build
```

To use it as a global command:

```bash
npm link
invoicegen --help
```

Without linking, run with `node dist/cli.js`.

---

## Usage

### Invoice only

```bash
invoicegen \
  --cliente "Acme Corp" \
  --bill-to "BCM" \
  --amount 1500 \
  --name "Carlos Perez" \
  --rut 123456789 \
  --company-address Algun rincon del mundo \
  --invoice-no invoice3 \
  --period feb2026
```

### Invoice + activity report

The repo includes an `activity-report.txt` template you can fill in with your work description before running:

```
<JIRA-TICKET> - I worked developing... (describe your work here)
```

Then pass it with `--report`:

```bash
invoicegen \
  --cliente "Acme Corp" \
  --bill-to "BCM" \
  --amount 1500 \
  --name "Carlos Perez" \
  --rut 123456789 \
  --company-address "Algun rincon del mundo" \
  --invoice-no invoice3 \
  --period feb2026 \
  --address "Calle Falsa 123, Montevideo" \
  --phone "+598 99 000 000" \
  --date 2026-02-20 \
  --country Uruguay \
  --absence-days "1,2,15" \
  --report ./activity-report.txt \
  --out-dir ./output
```

---

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--cliente <string>` | Yes | Client company name |
| `--bill-to <string>` | Yes | Company name shown in the Bill To section of the invoice |
| `--amount <number>` | Yes | Invoice amount in USD (> 0) |
| `--name <string>` | Yes | Your full name |
| `--bill-to <string>` | Yes | Company to bill |
| `--company-address <string>` | Yes | Company address |
| `--invoice-no <string>` | Yes | Invoice identifier |
| `--period <string>` | Yes | Billing period, e.g. `feb2026` |
| `--address <string>` | No | Your address (top-left of invoice) |
| `--phone <string>` | No | Your phone (top-left of invoice) |
| `--date <YYYY-MM-DD>` | No | Invoice date (defaults to today) |
| `--country <string>` | No | Country where services were delivered |
| `--absence-days <csv>` | No | Absence days, e.g. `"1,2,15"` |
| `--report <path>` | No | `.txt` file content for activity report PDF |
| `--out-dir <path>` | No | Output directory (default: `./out`) |

---

## Output files

| File | Name format |
|------|-------------|
| Invoice | `Facturacion: <period> - <invoiceNo> - <name>.pdf` |
| Activity report | `<period> - reporteactividad - <name>.pdf` |

The output directory is created automatically if it doesn't exist.

---

## Disclaimer

Provided AS IS. No network calls are made. No data is stored beyond the generated PDFs.

---

## License

MIT
