/**
 * invoicePrintTemplate.js
 * Professional A4 PDF generator — zero external dependencies.
 *
 * Uses two strategies:
 *   1. downloadInvoicePDF / downloadPayslipPDF  → generates a real PDF binary blob and triggers a direct file download
 *   2. printInvoicePDF / printPayslipPDF        → opens a styled HTML window for browser print / Save as PDF
 *
 * The PDF generator uses a minimal hand-written PDF structure.
 * PDF spec: ISO 32000-1. The format below is valid PDF 1.4.
 *
 * Cross-cutting utility — used by:
 *   epic4_billing  → BillingWorkspacePanel
 *   epic2_clinical → PatientRecordsPanel
 *   epic1_user_staff → StaffSelfServicePanel
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const rsStr = (val) =>
  `Rs. ${Number(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Health Guard User";

const fmtDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", { day: "2-digit", month: "long", year: "numeric" });
};

const fmtDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-LK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });
};

const shortId = (id) => String(id || "").slice(-8).toUpperCase() || "XXXXXXXX";

// ─── Minimal PDF Writer ──────────────────────────────────────────────────────
// Produces a valid PDF 1.4 file with text, lines, and rectangles.
// All coordinates in PDF user units (1 unit = 1/72 inch).
// A4: 595.28 × 841.89 pts.

class PdfWriter {
  constructor() {
    this.W = 595.28;
    this.H = 841.89;
    this.margin = 50;
    this.objects = [];   // array of raw PDF object strings
    this.pageStreams = []; // content streams per page
    this.currentStream = [];
    this.y = this.H - this.margin; // current Y position (top-down)
    this.fonts = { Helvetica: "F1", HelveticaBold: "F2", HelveticaOblique: "F3" };
    this._objCount = 0;
    this._pageObjectIds = [];
    this.filename = "document.pdf";
  }

  // PDF object helpers
  _newObj(content) {
    this._objCount++;
    this.objects.push({ id: this._objCount, content });
    return this._objCount;
  }

  // Escape string for PDF
  _esc(str) {
    return String(str || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[^\x20-\x7E]/g, (c) => {
        const code = c.charCodeAt(0);
        return code > 255 ? "?" : `\\${code.toString(8).padStart(3, "0")}`;
      });
  }

  // Truncate text to fit width (rough character-based estimate at 0.55 per char per pt)
  _truncate(text, maxWidth, fontSize) {
    const avgCharWidth = fontSize * 0.55;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 3) + "...";
  }

  // Add content stream command
  _cmd(line) {
    this.currentStream.push(line);
  }

  // ─── Drawing primitives ───

  setFont(name, size) {
    const f = name.includes("Bold") ? "F2" : name.includes("Italic") || name.includes("Oblique") ? "F3" : "F1";
    this._cmd(`/${f} ${size} Tf`);
    this._currentFont = name;
    this._currentSize = size;
  }

  setColor(r, g, b) {
    this._cmd(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} rg`);
  }

  setStrokeColor(r, g, b) {
    this._cmd(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} RG`);
  }

  setLineWidth(w) {
    this._cmd(`${w} w`);
  }

  text(x, pdfY, str, opts = {}) {
    // pdfY is in our top-down coordinate (converted internally)
    const y = pdfY; // already in PDF coordinates
    const escaped = this._esc(str);
    this._cmd(`BT ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  // Top-down helper: converts our Y to PDF Y
  td(yFromTop) {
    return this.H - yFromTop;
  }

  // Line
  line(x1, y1, x2, y2) {
    this._cmd(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  // Filled rectangle
  rect(x, y, w, h, r, g, b) {
    this.setColor(r, g, b);
    this._cmd(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${(-h).toFixed(2)} re f`);
  }

  // ─── Page management ───

  newPage() {
    if (this.currentStream.length > 0) {
      this._finalizePage();
    }
    this.currentStream = [];
    this.y = this.margin + 10; // top-down Y reset
  }

  _finalizePage() {
    const stream = this.currentStream.join("\n");
    const streamObjId = this._newObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageObjId = this._newObj(
      `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /MediaBox [0 0 ${this.W.toFixed(2)} ${this.H.toFixed(2)}] /Contents ${streamObjId} 0 R >>`
    );
    this._pageObjectIds.push(pageObjId);
    this.currentStream = [];
  }

  // ─── Generate PDF binary ───

  generate() {
    // Finalize last page
    if (this.currentStream.length > 0) {
      this._finalizePage();
    }

    // Build object array:
    // Obj 1: Catalog
    // Obj 2: Pages (placeholder, we'll build it last)
    // Obj 3: Info
    // Obj 4: Helvetica font
    // Obj 5: Helvetica-Bold font
    // Obj 6: Helvetica-Oblique font
    // Obj 7+: content streams and page objects

    const catalog = `<< /Type /Catalog /Pages 2 0 R >>`;
    const info = `<< /Producer (Health Guard PDF v1.0) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z) >>`;
    const pagesDict = `<< /Type /Pages /Kids [${this._pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${this._pageObjectIds.length} >>`;

    const helvetica = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    const helveticaBold = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
    const helveticaOblique = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`;

    // Fixed-ID objects (1-6), then our generated objects (7+)
    const fixedObjs = [
      { id: 1, content: catalog },
      { id: 2, content: pagesDict },
      { id: 3, content: info },
      { id: 4, content: helvetica },
      { id: 5, content: helveticaBold },
      { id: 6, content: helveticaOblique },
    ];

    // Re-offset generated object IDs by 6
    const shiftedObjs = this.objects.map((o) => ({ id: o.id + 6, content: o.content.replace(/(\d+) 0 R/g, (m, n) => `${parseInt(n) + 6} 0 R`) }));

    const allObjs = [...fixedObjs, ...shiftedObjs];

    // Build xref table
    let pdfParts = [`%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`];
    const offsets = [];

    for (const obj of allObjs) {
      offsets.push(pdfParts.join("").length);
      pdfParts.push(`${obj.id} 0 obj\n${obj.content}\nendobj\n\n`);
    }

    const xrefOffset = pdfParts.join("").length;
    const xref = [`xref\n0 ${allObjs.length + 1}\n0000000000 65535 f \n`];
    for (const off of offsets) {
      xref.push(`${String(off).padStart(10, "0")} 00000 n \n`);
    }
    pdfParts.push(xref.join(""));
    pdfParts.push(`trailer\n<< /Size ${allObjs.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return pdfParts.join("");
  }

  download(filename) {
    const content = this.generate();
    const bytes = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
      bytes[i] = content.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || this.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}

// ─── Invoice PDF Layout ───────────────────────────────────────────────────────

export function downloadInvoicePDF(invoice) {
  const pdf = new PdfWriter();
  const W = pdf.W;
  const margin = pdf.margin;
  const contentW = W - margin * 2;

  // Colors
  const BRAND = [19, 62, 104];         // #133e68
  const BRAND_LIGHT = [219, 234, 254]; // #dbeafe
  const INK = [30, 41, 59];            // #1e293b
  const MUTED = [100, 116, 139];       // #64748b
  const SUCCESS_BG = [220, 252, 231];  // #dcfce7
  const SUCCESS = [21, 128, 61];       // #15803d
  const WARN_BG = [254, 243, 199];     // #fef3c7
  const WARN = [146, 64, 14];          // #92400e
  const LINE = [226, 232, 240];        // #e2e8f0
  const WHITE = [255, 255, 255];

  const patient = invoice?.patientId;
  const patientName = typeof patient === "object" ? fullName(patient) : "Patient";
  const patientEmail = typeof patient === "object" ? (patient?.email || "") : "";
  const issuedDate = fmtDate(invoice?.createdAt);
  const paidDate = fmtDateTime(invoice?.updatedAt);
  const status = invoice?.status || "issued";
  const isPaid = status === "paid";
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const invId = shortId(invoice?._id);

  // PDF coordinate system: (0,0) at bottom-left, Y increases upward
  // We work top-down and convert using pdf.td()
  let y = 45; // top-down Y in pts from top of page

  // ─── Header background bar ───
  pdf.rect(0, pdf.td(y + 68), W, 68, ...BRAND);

  // Brand name
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 18);
  pdf.text(margin, pdf.td(y + 18), "Health Guard Medical Center");

  pdf.setFont("Helvetica", 9);
  pdf.text(margin, pdf.td(y + 32), "Colombo, Sri Lanka  |  +94 11 234 5678  |  info@healthguard.lk");

  // Doc type (right side)
  pdf.setFont("HelveticaBold", 22);
  const docLabel = isPaid ? "RECEIPT" : "INVOICE";
  const docLabelX = W - margin - (docLabel.length * 13);
  pdf.text(docLabelX, pdf.td(y + 20), docLabel);

  pdf.setFont("Helvetica", 9);
  pdf.text(W - margin - 90, pdf.td(y + 34), `Ref: #HG-${invId}`);
  pdf.text(W - margin - 90, pdf.td(y + 46), `Date: ${issuedDate}`);

  y += 80;

  // ─── Meta section background ───
  pdf.rect(margin, pdf.td(y + 58), contentW, 58, ...BRAND_LIGHT);

  // Patient info
  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(margin + 8, pdf.td(y + 12), "BILL TO");

  pdf.setColor(...INK);
  pdf.setFont("HelveticaBold", 11);
  pdf.text(margin + 8, pdf.td(y + 24), pdf._truncate(patientName, 180, 11));

  pdf.setColor(...MUTED);
  pdf.setFont("Helvetica", 8.5);
  if (patientEmail) pdf.text(margin + 8, pdf.td(y + 36), patientEmail);

  // Right: status + dates
  const rightX = W / 2 + 20;
  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(rightX, pdf.td(y + 12), "STATUS");
  pdf.setColor(...(isPaid ? SUCCESS : WARN));
  pdf.setFont("HelveticaBold", 10);
  pdf.text(rightX, pdf.td(y + 24), status.replace(/_/g, " ").toUpperCase());

  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(rightX + 120, pdf.td(y + 12), isPaid ? "PAID ON" : "INVOICE DATE");
  pdf.setColor(...INK);
  pdf.setFont("Helvetica", 8.5);
  pdf.text(rightX + 120, pdf.td(y + 24), isPaid ? paidDate : issuedDate);

  y += 70;

  // ─── Items table ───
  // Header row
  pdf.rect(margin, pdf.td(y + 16), contentW, 16, ...BRAND);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 8);
  pdf.text(margin + 6, pdf.td(y + 11), "#");
  pdf.text(margin + 22, pdf.td(y + 11), "DESCRIPTION");
  pdf.text(margin + contentW * 0.58, pdf.td(y + 11), "QTY");
  pdf.text(margin + contentW * 0.69, pdf.td(y + 11), "UNIT PRICE");
  pdf.text(margin + contentW * 0.85, pdf.td(y + 11), "AMOUNT");

  y += 18;

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      pdf.rect(margin, pdf.td(y + 14), contentW, 14, 248, 250, 252); // light gray
    }
    pdf.setColor(...INK);
    pdf.setFont("HelveticaBold", 8);
    pdf.text(margin + 6, pdf.td(y + 10), String(idx + 1));
    pdf.setFont("Helvetica", 8);
    pdf.text(margin + 22, pdf.td(y + 10), pdf._truncate(item.description || "—", 210, 8));
    pdf.text(margin + contentW * 0.58, pdf.td(y + 10), String(Number(item.quantity || 0)));
    pdf.text(margin + contentW * 0.67, pdf.td(y + 10), rsStr(item.unitPrice));
    pdf.setFont("HelveticaBold", 8);
    pdf.text(margin + contentW * 0.84, pdf.td(y + 10), rsStr(item.lineTotal));
    y += 15;
  });

  if (items.length === 0) {
    pdf.setColor(...MUTED);
    pdf.setFont("Helvetica", 9);
    pdf.text(margin + contentW / 2 - 40, pdf.td(y + 10), "No items recorded.");
    y += 15;
  }

  // Bottom line of table
  pdf.setStrokeColor(...LINE);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pdf.td(y + 2), margin + contentW, pdf.td(y + 2));

  y += 14;

  // ─── Totals box (right-aligned) ───
  const totW = 200;
  const totX = W - margin - totW;

  // Subtotal row
  pdf.rect(totX, pdf.td(y + 15), totW, 15, ...BRAND);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 9);
  pdf.text(totX + 8, pdf.td(y + 10), "TOTAL");
  pdf.text(totX + totW - 8 - rsStr(invoice?.subtotal).length * 5.5, pdf.td(y + 10), rsStr(invoice?.subtotal));
  y += 16;

  pdf.rect(totX, pdf.td(y + 14), totW, 14, ...SUCCESS_BG);
  pdf.setColor(...SUCCESS);
  pdf.setFont("HelveticaBold", 8.5);
  pdf.text(totX + 8, pdf.td(y + 9.5), "Amount Paid");
  pdf.text(totX + totW - 8 - rsStr(invoice?.paidAmount).length * 5, pdf.td(y + 9.5), rsStr(invoice?.paidAmount));
  y += 15;

  const outstanding = Number(invoice?.outstandingAmount || 0);
  const outBg = outstanding <= 0 ? SUCCESS_BG : WARN_BG;
  const outFg = outstanding <= 0 ? SUCCESS : WARN;
  pdf.rect(totX, pdf.td(y + 14), totW, 14, ...outBg);
  pdf.setColor(...outFg);
  pdf.setFont("HelveticaBold", 8.5);
  pdf.text(totX + 8, pdf.td(y + 9.5), "Outstanding");
  pdf.text(totX + totW - 8 - rsStr(invoice?.outstandingAmount).length * 5, pdf.td(y + 9.5), rsStr(invoice?.outstandingAmount));
  y += 18;

  // ─── Status note ───
  if (isPaid) {
    pdf.rect(margin, pdf.td(y + 28), contentW, 28, ...SUCCESS_BG);
    pdf.setColor(...SUCCESS);
    pdf.setFont("HelveticaBold", 10);
    pdf.text(margin + 12, pdf.td(y + 14), "Payment Received in Full");
    pdf.setFont("Helvetica", 8.5);
    pdf.text(margin + 12, pdf.td(y + 24), "This receipt confirms all charges are settled. Thank you for choosing Health Guard.");
  } else {
    pdf.rect(margin, pdf.td(y + 28), contentW, 28, ...WARN_BG);
    pdf.setColor(...WARN);
    pdf.setFont("HelveticaBold", 9);
    pdf.text(margin + 12, pdf.td(y + 14), "Payment Due");
    pdf.setFont("Helvetica", 8.5);
    pdf.text(margin + 12, pdf.td(y + 24), "Please settle the outstanding amount at the Health Guard cashier counter.");
  }
  y += 36;

  // ─── Footer ───
  const footerY = pdf.H - margin;
  pdf.setStrokeColor(...LINE);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, W - margin, footerY);

  pdf.setColor(...MUTED);
  pdf.setFont("Helvetica", 7.5);
  pdf.text(margin, footerY - 10, `Health Guard Medical Center  |  Official ${isPaid ? "Receipt" : "Invoice"}  |  Generated: ${new Date().toLocaleString("en-LK")}`);
  pdf.text(margin, footerY - 20, `Invoice ID: ${invoice?._id || "—"}  |  Full Reference: #HG-${invId}`);

  pdf.download(`healthguard-${isPaid ? "receipt" : "invoice"}-${invId}.pdf`);
}

// ─── Payslip PDF Layout ───────────────────────────────────────────────────────

export function downloadPayslipPDF(payroll) {
  const pdf = new PdfWriter();
  const W = pdf.W;
  const margin = pdf.margin;
  const contentW = W - margin * 2;

  const BRAND = [19, 62, 104];
  const BRAND_DARK = [11, 37, 69];
  const BRAND_LIGHT = [219, 234, 254];
  const INK = [30, 41, 59];
  const MUTED = [100, 116, 139];
  const SUCCESS_BG = [220, 252, 231];
  const SUCCESS = [21, 128, 61];
  const DANGER_BG = [254, 226, 226];
  const DANGER = [185, 28, 28];
  const LINE = [226, 232, 240];
  const WHITE = [255, 255, 255];
  const GRAY_BG = [248, 250, 252];

  const staffUser = payroll?.staffId?.userId;
  const staffName = typeof staffUser === "object" ? fullName(staffUser) : "Staff Member";
  const staffEmail = typeof staffUser === "object" ? (staffUser?.email || "") : "";
  const employeeId = payroll?.staffId?.employeeId || "—";
  const month = payroll?.month || "—";
  const payStatus = payroll?.status || "draft";
  const paidAt = payroll?.paidAt ? fmtDateTime(payroll.paidAt) : "Pending";

  const baseSalary = Number(payroll?.baseSalary || 0);
  const attendanceDays = Number(payroll?.attendanceDays || 0);
  const allowances = Number(payroll?.allowances || 0);
  const deductions = Number(payroll?.deductions || 0);
  const netSalary = Number(payroll?.netSalary || 0);
  const dailyRate = baseSalary > 0 ? baseSalary / 26 : 0;
  const earnedBase = dailyRate * attendanceDays;

  let monthLabel = month;
  try {
    const [yr, mo] = month.split("-");
    monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString("en-LK", { month: "long", year: "numeric" });
  } catch (_) { /* keep raw */ }

  let y = 45;

  // ─── Header ───
  pdf.rect(0, pdf.td(y + 68), W, 68, ...BRAND);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 18);
  pdf.text(margin, pdf.td(y + 18), "Health Guard Medical Center");
  pdf.setFont("Helvetica", 9);
  pdf.text(margin, pdf.td(y + 32), "Confidential Staff Payslip  |  Human Resources  |  hr@healthguard.lk");

  pdf.setFont("HelveticaBold", 22);
  const docLabelX = W - margin - 90;
  pdf.text(docLabelX, pdf.td(y + 20), "PAYSLIP");
  pdf.setFont("Helvetica", 9);
  pdf.text(docLabelX - 10, pdf.td(y + 34), `Period: ${monthLabel}`);
  pdf.text(docLabelX - 10, pdf.td(y + 46), `Status: ${payStatus.toUpperCase()}`);
  y += 80;

  // ─── Employee meta ───
  pdf.rect(margin, pdf.td(y + 58), contentW, 58, ...BRAND_LIGHT);

  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(margin + 8, pdf.td(y + 12), "EMPLOYEE");
  pdf.setColor(...INK);
  pdf.setFont("HelveticaBold", 12);
  pdf.text(margin + 8, pdf.td(y + 24), pdf._truncate(staffName, 200, 12));
  pdf.setColor(...MUTED);
  pdf.setFont("Helvetica", 8.5);
  if (staffEmail) pdf.text(margin + 8, pdf.td(y + 36), staffEmail);

  const rightX = W / 2 + 20;
  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(rightX, pdf.td(y + 12), "EMPLOYEE ID");
  pdf.setColor(...INK);
  pdf.setFont("HelveticaBold", 9);
  pdf.text(rightX, pdf.td(y + 24), employeeId);

  pdf.setColor(...MUTED);
  pdf.setFont("HelveticaBold", 7.5);
  pdf.text(rightX + 100, pdf.td(y + 12), "PAYMENT DATE");
  pdf.setColor(...INK);
  pdf.setFont("Helvetica", 8.5);
  pdf.text(rightX + 100, pdf.td(y + 24), paidAt);

  y += 70;

  // ─── Attendance summary ───
  const colW = contentW / 4;
  const summaryItems = [
    ["ATTENDANCE DAYS", String(attendanceDays), "of 26 working days"],
    ["DAILY RATE", rsStr(dailyRate), "per working day"],
    ["BASE SALARY", rsStr(baseSalary), "monthly base"],
    ["PAY PERIOD", monthLabel, ""]
  ];

  summaryItems.forEach((item, idx) => {
    const x = margin + idx * colW;
    pdf.rect(x, pdf.td(y + 40), colW - 2, 40, ...GRAY_BG);
    pdf.setColor(...MUTED);
    pdf.setFont("HelveticaBold", 7);
    pdf.text(x + 6, pdf.td(y + 10), item[0]);
    pdf.setColor(...INK);
    pdf.setFont("HelveticaBold", 9.5);
    pdf.text(x + 6, pdf.td(y + 22), pdf._truncate(item[1], colW - 12, 9.5));
    pdf.setColor(...MUTED);
    pdf.setFont("Helvetica", 7.5);
    if (item[2]) pdf.text(x + 6, pdf.td(y + 33), item[2]);
  });
  y += 50;

  // ─── Earnings table ───
  const halfW = contentW / 2 - 4;

  // Left: Earnings
  pdf.rect(margin, pdf.td(y + 14), halfW, 14, ...BRAND);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 8);
  pdf.text(margin + 6, pdf.td(y + 9.5), "EARNINGS");
  y += 15;

  const earningsRows = [
    ["Earned Base", `(${attendanceDays}d × ${rsStr(dailyRate)})`, rsStr(earnedBase)],
    ["Allowances", "", rsStr(allowances)],
    ["Gross Earnings", "", rsStr(earnedBase + allowances)]
  ];

  earningsRows.forEach((row, idx) => {
    const bg = idx === earningsRows.length - 1 ? SUCCESS_BG : idx % 2 === 0 ? GRAY_BG : WHITE;
    pdf.rect(margin, pdf.td(y + 14), halfW, 14, ...bg);
    pdf.setColor(...INK);
    pdf.setFont(idx === earningsRows.length - 1 ? "HelveticaBold" : "Helvetica", 8.5);
    pdf.text(margin + 6, pdf.td(y + 9.5), row[0]);
    pdf.setColor(...MUTED);
    pdf.setFont("Helvetica", 7.5);
    if (row[1]) pdf.text(margin + 6 + String(row[0]).length * 4.8, pdf.td(y + 9.5), row[1]);
    pdf.setColor(...(idx === earningsRows.length - 1 ? SUCCESS : INK));
    pdf.setFont(idx === earningsRows.length - 1 ? "HelveticaBold" : "Helvetica", 8.5);
    const valX = margin + halfW - 8 - String(row[2]).length * 5;
    pdf.text(valX, pdf.td(y + 9.5), row[2]);
    y += 15;
  });

  // Right: Deductions (reset Y to before earnings rows)
  const deductY = y - 15 * earningsRows.length - 15;
  let dy = deductY;

  pdf.rect(margin + halfW + 8, pdf.td(dy + 14), halfW, 14, [127, 29, 29]);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 8);
  pdf.text(margin + halfW + 14, pdf.td(dy + 9.5), "DEDUCTIONS");
  dy += 15;

  const deductRows = [
    ["Total Deductions", "", rsStr(deductions)],
    ["", "", ""],
    ["Net Deductions", "", rsStr(deductions)]
  ];

  deductRows.forEach((row, idx) => {
    const bg = idx === deductRows.length - 1 ? DANGER_BG : idx % 2 === 0 ? GRAY_BG : WHITE;
    pdf.rect(margin + halfW + 8, pdf.td(dy + 14), halfW, 14, ...bg);
    if (row[0]) {
      pdf.setColor(...(idx === deductRows.length - 1 ? DANGER : INK));
      pdf.setFont(idx === deductRows.length - 1 ? "HelveticaBold" : "Helvetica", 8.5);
      pdf.text(margin + halfW + 14, pdf.td(dy + 9.5), row[0]);
      const valX = margin + halfW + 8 + halfW - 8 - String(row[2]).length * 5;
      pdf.text(valX, pdf.td(dy + 9.5), `- ${row[2]}`);
    }
    dy += 15;
  });

  y += 10;

  // ─── Net Salary highlight box ───
  pdf.rect(margin, pdf.td(y + 44), contentW, 44, ...BRAND_DARK);
  pdf.setColor(...WHITE);
  pdf.setFont("HelveticaBold", 10);
  pdf.text(margin + 16, pdf.td(y + 16), "NET SALARY");
  pdf.setFont("Helvetica", 8.5);
  pdf.text(margin + 16, pdf.td(y + 28), `${monthLabel}  ·  ${attendanceDays} attendance days  ·  ${payStatus.toUpperCase()}`);

  pdf.setFont("HelveticaBold", 20);
  const netStr = rsStr(netSalary);
  const netX = W - margin - 16 - netStr.length * 11;
  pdf.text(netX > margin + 200 ? netX : margin + 200, pdf.td(y + 22), netStr);
  y += 54;

  // ─── Calculation note ───
  pdf.rect(margin, pdf.td(y + 28), contentW, 28, ...GRAY_BG);
  pdf.setColor(...MUTED);
  pdf.setFont("Helvetica", 7.5);
  pdf.text(margin + 8, pdf.td(y + 11), "Calculation: Net Salary = (Base Salary ÷ 26) × Attendance Days + Allowances − Deductions");
  pdf.text(margin + 8, pdf.td(y + 22), "This payslip is computer-generated and does not require a physical signature.");
  y += 36;

  // ─── Footer ───
  const footerY = pdf.H - margin;
  pdf.setStrokeColor(...LINE);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, W - margin, footerY);
  pdf.setColor(...MUTED);
  pdf.setFont("Helvetica", 7.5);
  pdf.text(margin, footerY - 10, `Health Guard Medical Center  |  Confidential Payslip  |  Generated: ${new Date().toLocaleString("en-LK")}`);

  pdf.download(`healthguard-payslip-${month}-${employeeId}.pdf`);
}

// ─── Print-window versions (keep for print/share use case) ───────────────────

const PRINT_STYLES = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:16mm 18mm}
  html,body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @media screen{body{padding:24px;max-width:820px;margin:0 auto;background:#f8fafc}.page{background:#fff;padding:32px 36px;box-shadow:0 4px 24px rgba(0,0,0,.1);border-radius:8px}}
  @media print{.no-print{display:none!important}}
  .doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2.5px solid #133e68;margin-bottom:20px}
  .brand-name{font-size:15pt;font-weight:800;color:#133e68}.brand-sub{font-size:8pt;color:#64748b;margin-top:2px}
  .doc-type{font-size:20pt;font-weight:900;color:#133e68;text-align:right}.doc-sub{font-size:9pt;color:#64748b;text-align:right;margin-top:3px}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px}
  .meta-label{font-size:7.5pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .meta-value{font-size:10pt;font-weight:600;color:#1e293b}
  .badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:8pt;font-weight:700;text-transform:uppercase}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:10pt}
  thead tr{background:#133e68;color:#fff}thead th{padding:8px 10px;font-size:8.5pt;font-weight:700;text-transform:uppercase;text-align:left}
  thead th.r{text-align:right}tbody tr{border-bottom:1px solid #e2e8f0}tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:9px 10px}tbody td.r{text-align:right}
  .totals{display:flex;justify-content:flex-end;margin-bottom:20px}.totals-box{width:280px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .totals-row{display:flex;justify-content:space-between;padding:7px 14px;font-size:10pt;border-bottom:1px solid #e2e8f0}
  .totals-row:last-child{border-bottom:none}.totals-row.hl{background:#133e68;color:#fff;font-weight:700;font-size:11pt}
  .totals-row.paid{background:#dcfce7;color:#15803d;font-weight:600}.totals-row.out{background:#fef3c7;color:#92400e;font-weight:600}
  .totals-row.out0{background:#dcfce7;color:#15803d;font-weight:600}
  .note{border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:9pt}
  .note.ok{background:#dcfce7;color:#15803d;border:1px solid #a7f3d0}.note.warn{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
  .footer{border-top:1px solid #e2e8f0;padding-top:14px;margin-top:8px;font-size:8pt;color:#64748b}
  .comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .comp-card{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .comp-hdr{padding:7px 12px;font-size:8.5pt;font-weight:700;text-transform:uppercase;background:#133e68;color:#fff}
  .comp-hdr.d{background:#7f1d1d}.comp-row{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #e2e8f0;font-size:10pt}
  .comp-row:last-child{border-bottom:none}.comp-row.sub{background:#f8fafc;font-weight:600}
  .net-box{background:linear-gradient(135deg,#0b2545,#133e68);color:#fff;border-radius:8px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
  .net-lbl{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.8px;opacity:.8}
  .net-val{font-size:18pt;font-weight:900}
  .print-bar{text-align:center;padding:18px;display:flex;gap:10px;justify-content:center}
  .btn-p{background:#133e68;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:10pt;font-weight:700;cursor:pointer}
  .btn-d{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:10px 22px;border-radius:8px;font-size:10pt;font-weight:600;cursor:pointer}
`;

function openPrintWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=860,height=900,scrollbars=yes");
  if (!win) { alert("Please allow pop-ups to open the PDF viewer."); return; }
  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title><style>${PRINT_STYLES}</style></head><body>
    <div class="print-bar no-print">
      <button class="btn-p" onclick="window.print()">Print / Save as PDF</button>
      <button class="btn-d" onclick="window.close()">Close</button>
    </div>
    <div class="page">${bodyHtml}</div></body></html>`);
  win.document.close();
}

export function printInvoicePDF(invoice) {
  const patient = invoice?.patientId;
  const patientName = typeof patient === "object" ? fullName(patient) : "Patient";
  const patientEmail = typeof patient === "object" ? (patient?.email || "") : "";
  const issuedDate = fmtDate(invoice?.createdAt);
  const status = invoice?.status || "issued";
  const isPaid = status === "paid";
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const invId = shortId(invoice?._id);
  const outstanding = Number(invoice?.outstandingAmount || 0);

  const itemRows = items.map((item, idx) => `
    <tr><td>${idx + 1}</td><td>${item.description || "—"}</td>
    <td class="r">${Number(item.quantity || 0)}</td>
    <td class="r">${rsStr(item.unitPrice)}</td>
    <td class="r"><strong>${rsStr(item.lineTotal)}</strong></td></tr>`).join("") ||
    `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:18px">No items recorded</td></tr>`;

  const body = `
    <div class="doc-header">
      <div><div class="brand-name">Health Guard Medical Center</div>
      <div class="brand-sub">Colombo, Sri Lanka · +94 11 234 5678 · info@healthguard.lk</div></div>
      <div><div class="doc-type">${isPaid ? "RECEIPT" : "INVOICE"}</div>
      <div class="doc-sub">#HG-${invId}</div><div class="doc-sub">Issued: ${issuedDate}</div></div>
    </div>
    <div class="meta-grid">
      <div><div class="meta-label">Bill To</div><div class="meta-value" style="font-size:11pt">${patientName}</div>${patientEmail ? `<div style="color:#64748b;font-size:9pt">${patientEmail}</div>` : ""}</div>
      <div><div class="meta-label">Reference</div><div class="meta-value">#HG-${invId}</div></div>
      <div><div class="meta-label">Date Issued</div><div class="meta-value">${issuedDate}</div></div>
      <div><div class="meta-label">Status</div><div class="meta-value"><span class="badge" style="${isPaid ? "background:#dcfce7;color:#15803d" : "background:#fef3c7;color:#92400e"}">${status.replace(/_/g, " ").toUpperCase()}</span></div></div>
    </div>
    <table><thead><tr><th style="width:32px">#</th><th>Description</th><th class="r" style="width:60px">Qty</th><th class="r" style="width:110px">Unit Price</th><th class="r" style="width:120px">Amount</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <div class="totals"><div class="totals-box">
      <div class="totals-row hl"><span>TOTAL</span><span>${rsStr(invoice?.subtotal)}</span></div>
      <div class="totals-row paid"><span>Amount Paid</span><span>${rsStr(invoice?.paidAmount)}</span></div>
      <div class="totals-row ${outstanding <= 0 ? "out0" : "out"}"><span>Outstanding</span><span>${rsStr(invoice?.outstandingAmount)}</span></div>
    </div></div>
    ${isPaid
      ? `<div class="note ok"><strong>Payment Received in Full</strong><br>This receipt confirms all charges are settled. Thank you for choosing Health Guard.</div>`
      : `<div class="note warn"><strong>Payment Due</strong><br>Please settle the outstanding amount at the Health Guard cashier counter.</div>`}
    <div class="footer">Health Guard Medical Center · Official ${isPaid ? "Receipt" : "Invoice"} · Generated: ${new Date().toLocaleString("en-LK")}</div>`;

  openPrintWindow(`Invoice #HG-${invId} | Health Guard`, body);
}

export function printPayslipPDF(payroll) {
  const staffUser = payroll?.staffId?.userId;
  const staffName = typeof staffUser === "object" ? fullName(staffUser) : "Staff Member";
  const staffEmail = typeof staffUser === "object" ? (staffUser?.email || "") : "";
  const employeeId = payroll?.staffId?.employeeId || "—";
  const month = payroll?.month || "—";
  const payStatus = payroll?.status || "draft";
  const paidAt = payroll?.paidAt ? fmtDateTime(payroll.paidAt) : "Pending";

  const baseSalary = Number(payroll?.baseSalary || 0);
  const attendanceDays = Number(payroll?.attendanceDays || 0);
  const allowances = Number(payroll?.allowances || 0);
  const deductions = Number(payroll?.deductions || 0);
  const netSalary = Number(payroll?.netSalary || 0);
  const dailyRate = baseSalary > 0 ? baseSalary / 26 : 0;
  const earnedBase = dailyRate * attendanceDays;

  let monthLabel = month;
  try {
    const [yr, mo] = month.split("-");
    monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString("en-LK", { month: "long", year: "numeric" });
  } catch (_) {}

  const body = `
    <div class="doc-header">
      <div><div class="brand-name">Health Guard Medical Center</div>
      <div class="brand-sub">Confidential Staff Payslip · hr@healthguard.lk</div></div>
      <div><div class="doc-type">PAYSLIP</div>
      <div class="doc-sub">Period: ${monthLabel}</div>
      <div class="doc-sub"><span class="badge" style="background:#dbeafe;color:#1d4ed8">${payStatus.toUpperCase()}</span></div></div>
    </div>
    <div class="meta-grid">
      <div><div class="meta-label">Employee</div><div class="meta-value" style="font-size:11pt">${staffName}</div>${staffEmail ? `<div style="color:#64748b;font-size:9pt">${staffEmail}</div>` : ""}</div>
      <div><div class="meta-label">Employee ID</div><div class="meta-value">${employeeId}</div></div>
      <div><div class="meta-label">Pay Period</div><div class="meta-value">${monthLabel}</div></div>
      <div><div class="meta-label">Payment Date</div><div class="meta-value">${paidAt}</div></div>
      <div><div class="meta-label">Attendance Days</div><div class="meta-value">${attendanceDays} <span style="font-weight:400;color:#64748b;font-size:9pt">of 26</span></div></div>
      <div><div class="meta-label">Daily Rate</div><div class="meta-value">${rsStr(dailyRate)}</div></div>
    </div>
    <div class="comp-grid">
      <div class="comp-card">
        <div class="comp-hdr">Earnings</div>
        <div class="comp-row"><span>Base Salary (monthly)</span><span>${rsStr(baseSalary)}</span></div>
        <div class="comp-row"><span>Earned (${attendanceDays}d × ${rsStr(dailyRate)})</span><span>${rsStr(earnedBase)}</span></div>
        <div class="comp-row"><span>Allowances</span><span>${rsStr(allowances)}</span></div>
        <div class="comp-row sub"><span>Gross Earnings</span><span>${rsStr(earnedBase + allowances)}</span></div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr d">Deductions</div>
        <div class="comp-row"><span>Total Deductions</span><span>- ${rsStr(deductions)}</span></div>
        <div class="comp-row" style="min-height:38px">&nbsp;</div>
        <div class="comp-row sub"><span>Net Deductions</span><span>- ${rsStr(deductions)}</span></div>
      </div>
    </div>
    <div class="net-box">
      <div><div class="net-lbl">Net Salary</div><div style="font-size:9pt;opacity:.7;margin-top:3px">${monthLabel} · ${attendanceDays} attendance days</div></div>
      <div class="net-val">${rsStr(netSalary)}</div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:8.5pt;color:#64748b">
      <strong style="color:#1e293b">Calculation:</strong> Net = (Base ÷ 26) × Attendance Days + Allowances − Deductions. Computer generated, no signature required.
    </div>
    <div class="footer">Health Guard Medical Center · Confidential Payslip · Generated: ${new Date().toLocaleString("en-LK")}</div>`;

  openPrintWindow(`Payslip ${monthLabel} – ${staffName} | Health Guard`, body);
}
