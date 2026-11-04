import type { jsPDF } from 'jspdf';
import { InvoiceData } from '@/types/invoice';
import { formatDateIndo } from '@/lib/format';

type RGB = [number, number, number];

const PURPLE: RGB = [77, 48, 133];
const PINK: RGB = [243, 112, 168];
const INK: RGB = [24, 24, 27];
const MUTED: RGB = [113, 113, 122];
const LINE: RGB = [212, 212, 216];
const SOFT: RGB = [244, 244, 245];
const ROSE: RGB = [225, 29, 72];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const CW = PAGE_W - M * 2;

async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims: { w: number; h: number } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null;
  }
}

/** Vector A4 crew work-order PDF (selectable text, multi-page). Replaces screenshotting the DOM. */
export async function buildCrewSheetPdf(invoice: InvoiceData): Promise<Blob> {
  const { jsPDF: PDF } = await import('jspdf');
  const pdf: jsPDF = new PDF({ unit: 'mm', format: 'a4', compress: true });
  const logo = await loadImage('/images/logo.png');

  let y = M;

  const color = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const font = (size: number, bold = false, c: RGB = INK, italic = false) => {
    pdf.setFont('helvetica', bold ? (italic ? 'bolditalic' : 'bold') : italic ? 'italic' : 'normal');
    pdf.setFontSize(size);
    color(c);
  };
  const hline = (yy: number, c: RGB = LINE, w = 0.25) => {
    pdf.setDrawColor(c[0], c[1], c[2]);
    pdf.setLineWidth(w);
    pdf.line(M, yy, M + CW, yy);
  };
  const ensure = (h: number) => {
    if (y + h > PAGE_H - M - 6) {
      pdf.addPage();
      y = M;
    }
  };
  const wrap = (text: string, width: number): string[] => pdf.splitTextToSize(text || '', width) as string[];

  const box = (x: number, yy: number, checked: boolean) => {
    const s = 4;
    pdf.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
    pdf.setLineWidth(0.4);
    pdf.rect(x, yy, s, s);
    if (checked) {
      pdf.setDrawColor(PURPLE[0], PURPLE[1], PURPLE[2]);
      pdf.setLineWidth(0.6);
      pdf.line(x + 0.8, yy + 2.2, x + 1.7, yy + 3.1);
      pdf.line(x + 1.7, yy + 3.1, x + 3.3, yy + 0.9);
    }
  };

  // ---------- Header ----------
  let logoH = 0;
  if (logo) {
    logoH = 13;
    const logoW = (logo.w / logo.h) * logoH;
    pdf.addImage(logo.data, 'PNG', M, y, logoW, logoH);
  }
  const pillText = 'SURAT TUGAS & CHECKLIST';
  font(8, true, [255, 255, 255]);
  const pillW = pdf.getTextWidth(pillText) + 9;
  pdf.setFillColor(PURPLE[0], PURPLE[1], PURPLE[2]);
  pdf.roundedRect(M + CW - pillW, y, pillW, 7, 3.5, 3.5, 'F');
  pdf.text(pillText, M + CW - pillW / 2, y + 4.7, { align: 'center' });
  font(8.5, true, [63, 63, 70]);
  pdf.text(`NO. JOB: #${invoice.invoiceNumber}`, M + CW, y + 12.5, { align: 'right' });

  y += Math.max(logoH, 13) + 4;
  font(6.5, true, MUTED);
  pdf.text('PROFESSIONAL BALLOON & PARTY DECORATION', M, y, { charSpace: 0.4 });
  y += 3;
  hline(y, INK, 0.7);
  y += 6;

  // ---------- Meta: customer (left) + schedule card (right) ----------
  const leftW = CW * 0.52;
  const cardX = M + CW * 0.56;
  const cardW = CW * 0.44;
  const metaTop = y;

  const label = (text: string, x: number, yy: number) => {
    font(6.5, true, MUTED);
    pdf.text(text.toUpperCase(), x, yy);
  };

  let ly = metaTop;
  label('Pelanggan / Pemesan', M, ly);
  ly += 4.8;
  font(11, true);
  pdf.text(invoice.clientName || '-', M, ly);
  if (invoice.clientPhone) {
    ly += 4.6;
    font(8.5, false, MUTED);
    pdf.text(invoice.clientPhone, M, ly);
  }
  ly += 7;
  label('Lokasi / Venue Pemasangan', M, ly);
  ly += 4.6;
  font(9.5, true);
  const venueLines = wrap(invoice.venue || invoice.clientAddress || 'Lokasi belum ditentukan', leftW);
  pdf.text(venueLines, M, ly);
  ly += venueLines.length * 4.4;
  if (invoice.assignedCrew) {
    ly += 2.6;
    label('Petugas / Crew yang Bertugas', M, ly);
    ly += 4.6;
    font(9.5, true, PURPLE);
    const crewLines = wrap(invoice.assignedCrew, leftW);
    pdf.text(crewLines, M, ly);
    ly += crewLines.length * 4.4;
  }

  const cardH = invoice.eventEndTime ? 36 : 30;
  pdf.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
  pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(cardX, metaTop - 4, cardW, cardH, 3, 3, 'FD');
  label('Jadwal Hari & Tanggal Acara', cardX + 4, metaTop + 1);
  font(11, true, PURPLE);
  pdf.text(invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '-', cardX + 4, metaTop + 7);
  pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
  pdf.line(cardX + 4, metaTop + 10, cardX + cardW - 4, metaTop + 10);
  label('Jam Setup Balon', cardX + 4, metaTop + 15);
  label('Jam Acara Mulai', cardX + cardW / 2 + 1, metaTop + 15);
  font(10, true);
  pdf.text(
    invoice.setupTime === '00:00' ? '-' : `${invoice.setupTime || '11:00'} WIB`,
    cardX + 4,
    metaTop + 20.5
  );
  pdf.text(`${invoice.eventTime || '14:00'} WIB`, cardX + cardW / 2 + 1, metaTop + 20.5);
  if (invoice.eventEndTime) {
    font(7.5, false, MUTED);
    pdf.text(`Perkiraan selesai / bongkar: ${invoice.eventEndTime} WIB`, cardX + 4, metaTop + 27.5);
  }

  y = Math.max(ly, metaTop - 4 + cardH) + 4;
  hline(y);
  y += 6;

  // ---------- Tema ----------
  const tema = invoice.themeNote || invoice.items?.[0]?.description;
  if (tema) {
    label('Tema & Konsep Balon', M, y);
    y += 4.6;
    font(9.5, true);
    const lines = wrap(tema, CW);
    pdf.text(lines, M, y);
    y += lines.length * 4.4 + 1;
    hline(y);
    y += 6;
  }

  // ---------- Table helpers ----------
  const sectionTitle = (title: string, hint?: string) => {
    ensure(18);
    font(9, true);
    pdf.text(title.toUpperCase(), M, y, { charSpace: 0.2 });
    if (hint) {
      font(7, false, MUTED, true);
      pdf.text(hint, M + CW, y, { align: 'right' });
    }
    y += 3;
  };

  const COL = {
    bawa: M + 11,
    desc: M + 22,
    qty: M + CW - 32,
    back: M + CW - 11,
  };

  const tableHeader = (cols: { text: string; x: number; align?: 'left' | 'center' }[]) => {
    pdf.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
    pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(M, y, CW, 7, 'FD');
    font(6.8, true, [82, 82, 91]);
    cols.forEach((c) => pdf.text(c.text.toUpperCase(), c.x, y + 4.6, { align: c.align || 'left' }));
    y += 7;
  };

  const rowFrame = (h: number) => {
    pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
    pdf.setLineWidth(0.3);
    pdf.line(M, y, M, y + h);
    pdf.line(M + CW, y, M + CW, y + h);
    pdf.line(M, y + h, M + CW, y + h);
  };

  // ---------- 1. Items from invoice ----------
  sectionTitle('1. Paket & Item Pesanan Client', 'Centang saat packing & setelah bongkar');
  y += 2;
  tableHeader([
    { text: 'Bawa', x: COL.bawa, align: 'center' },
    { text: 'Deskripsi Layanan / Item', x: COL.desc },
    { text: 'Qty', x: COL.qty, align: 'center' },
    { text: 'Kembali', x: COL.back, align: 'center' },
  ]);
  invoice.items.forEach((it) => {
    font(9.5, true);
    const lines = wrap(it.description || '-', COL.qty - COL.desc - 8);
    const h = Math.max(8, lines.length * 4.4 + 3.6);
    if (y + h > PAGE_H - M - 6) {
      pdf.addPage();
      y = M;
      tableHeader([
        { text: 'Bawa', x: COL.bawa, align: 'center' },
        { text: 'Deskripsi Layanan / Item', x: COL.desc },
        { text: 'Qty', x: COL.qty, align: 'center' },
        { text: 'Kembali', x: COL.back, align: 'center' },
      ]);
    }
    rowFrame(h);
    box(COL.bawa - 2, y + h / 2 - 2, false);
    font(9.5, false);
    pdf.text(lines, COL.desc, y + h / 2 - ((lines.length - 1) * 4.4) / 2 + 1.2);
    font(9.5, true);
    pdf.text(String(it.quantity || 1), COL.qty, y + h / 2 + 1.2, { align: 'center' });
    box(COL.back - 2, y + h / 2 - 2, false);
    y += h;
  });
  y += 9;

  // ---------- 2. Warehouse props ----------
  const props = invoice.dispatchedProperties || [];
  sectionTitle('2. Alat & Properti Gudang (Packing List)', `${props.length} item`);
  y += 2;
  const propHeader = () =>
    tableHeader([
      { text: 'Bawa', x: COL.bawa, align: 'center' },
      { text: 'Nama Properti & Alat Gudang', x: COL.desc },
      { text: 'Jumlah', x: COL.qty, align: 'center' },
      { text: 'Kembali', x: COL.back, align: 'center' },
    ]);
  propHeader();
  if (props.length === 0) {
    rowFrame(12);
    font(8.5, false, MUTED, true);
    pdf.text('Belum ada properti atau alat gudang yang dicatat.', M + CW / 2, y + 7, { align: 'center' });
    y += 12;
  }
  props.forEach((p) => {
    const sub: string[] = [];
    if (p.balloonType) sub.push(String(p.balloonType).toUpperCase());
    if (p.balloonSize) sub.push(String(p.balloonSize).replace('_inch', '"'));
    if (!p.balloonType && p.category) sub.push(`Kategori: ${p.category}`);
    font(9.5, true);
    const nameLines = wrap(p.name, COL.qty - COL.desc - 8);
    const noteLines = p.notes ? wrap(`Catatan: ${p.notes}`, COL.qty - COL.desc - 8) : [];
    const h = Math.max(
      10,
      nameLines.length * 4.4 + (sub.length ? 3.8 : 0) + noteLines.length * 3.8 + 4.6
    );
    if (y + h > PAGE_H - M - 6) {
      pdf.addPage();
      y = M;
      propHeader();
    }
    rowFrame(h);
    box(COL.bawa - 2, y + h / 2 - 2, Boolean(p.checkedOut));
    let ty = y + 5.6;
    font(9.5, true);
    pdf.text(nameLines, COL.desc, ty);
    ty += nameLines.length * 4.4 - 0.6;
    if (sub.length) {
      font(7, false, MUTED);
      pdf.text(sub.join('  |  '), COL.desc, ty);
      ty += 3.8;
    }
    if (noteLines.length) {
      font(7.5, false, ROSE);
      pdf.text(noteLines, COL.desc, ty);
    }
    font(9.5, true);
    pdf.text(`${p.quantity} ${p.unit || 'Unit'}`, COL.qty, y + h / 2 + 1.2, { align: 'center' });
    box(COL.back - 2, y + h / 2 - 2, Boolean(p.checkedIn));
    y += h;
  });
  y += 6;

  // ---------- Crew note ----------
  if (invoice.crewNote) {
    font(9.5, false);
    const lines = wrap(invoice.crewNote, CW - 10);
    const h = lines.length * 4.4 + 13;
    ensure(h + 4);
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(253, 230, 138);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, CW, h, 3, 3, 'FD');
    font(6.8, true, [146, 64, 14]);
    pdf.text('INSTRUKSI / CATATAN KHUSUS UNTUK TIM LAPANGAN:', M + 5, y + 5.5);
    font(9.5, false, [69, 26, 3]);
    pdf.text(lines, M + 5, y + 11);
    y += h + 5;
  }

  // ---------- Signatures ----------
  ensure(38);
  hline(y);
  y += 6;
  const colW = (CW - 20) / 2;
  ['PIC Workshop / Dispatcher', 'Koordinator Crew Lapangan'].forEach((role, i) => {
    const x = M + i * (colW + 20);
    font(7, true, MUTED);
    pdf.text(role.toUpperCase(), x + colW / 2, y, { align: 'center' });
    pdf.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
    pdf.setLineWidth(0.35);
    pdf.line(x, y + 20, x + colW, y + 20);
    font(7, false, MUTED);
    pdf.text('Nama jelas & tanda tangan', x + colW / 2, y + 24, { align: 'center' });
  });

  // ---------- Page numbers ----------
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    font(7, false, MUTED);
    pdf.text(`Hal ${i}/${total}`, PAGE_W - M, PAGE_H - 8, { align: 'right' });
  }

  return pdf.output('blob');
}
