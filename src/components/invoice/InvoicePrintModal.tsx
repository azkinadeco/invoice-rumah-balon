'use client';

import React, { useState } from 'react';
import { InvoiceData } from '@/types/invoice';
import { formatRupiah, formatDateIndo, formatWhatsAppPhone } from '@/lib/format';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  FileImage,
  Send,
  Loader2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Check,
  MessageCircle,
  Copy,
} from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [scale, setScale] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [customPhone, setCustomPhone] = useState(invoice?.clientPhone || '');
  const [showPhoneEditor, setShowPhoneEditor] = useState(false);

  // Auto-adapt preview scale on mobile so A5 fits screen width perfectly
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      const calculated = Math.min(0.65, Math.max(0.48, Number(((window.innerWidth - 36) / 560).toFixed(2))));
      setScale(calculated);
    }
  }, [isOpen]);

  if (!invoice) return null;

  // Unified canvas capture for both PDF and PNG.
  // html-to-image rasterizes with the browser's own layout engine, so custom fonts and flex
  // alignment match the preview exactly (html2canvas drew text at the wrong baseline).
  const captureInvoiceCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const element = document.getElementById('invoice-preview-capture');
    if (!element) return null;

    try {
      const { toCanvas } = await import('html-to-image');

      // Custom fonts must be ready before rasterizing
      await Promise.all(
        ['DOSans', 'Lepetitcochon', 'Lazydog'].map((f) => document.fonts.load(`16px "${f}"`).catch(() => []))
      );
      await document.fonts.ready;

      const options = {
        pixelRatio: 2.5,
        backgroundColor: '#fff9f5',
        width: 560,
        height: 794,
        // Preview zoom is a CSS transform on a wrapper; render the paper itself at 100%
        style: { transform: 'none', boxShadow: 'none', margin: '0' },
      };
      // First pass warms up font/image inlining (Safari renders blanks otherwise)
      await toCanvas(element, options);
      return await toCanvas(element, options);
    } catch (err) {
      console.error('Invoice capture error:', err);
      return null;
    }
  };

  // 1. Download as A5 PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await captureInvoiceCanvas();
      if (!canvas) {
        alert('Gagal membuat pratinjau invoice untuk PDF.');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
        compress: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, 148, 210, undefined, 'FAST');

      const fileName = `Invoice_${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}_A5.pdf`;
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Mengunduh via print browser...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Download as PNG image (A5 proportion)
  const handleDownloadPng = async () => {
    try {
      setIsGeneratingImage(true);
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await captureInvoiceCanvas();
      if (!canvas) {
        alert('Gagal mengambil gambar invoice.');
        return;
      }

      const link = document.createElement('a');
      link.download = `Invoice_${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}_A5.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Gagal mendownload gambar.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Copy A5 Image directly to OS Clipboard (for instant paste to WhatsApp Web)
  const handleCopyImageToClipboard = async () => {
    try {
      setIsCopyingImage(true);
      const canvas = await captureInvoiceCanvas();
      if (!canvas) {
        alert('Gagal mengambil gambar invoice.');
        return;
      }
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCopyingImage(false);
          return;
        }
        try {
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImageSuccess(true);
            setTimeout(() => setCopiedImageSuccess(false), 3000);
          } else {
            handleDownloadPng();
          }
        } catch (err) {
          console.warn('Clipboard write fallback to download:', err);
          handleDownloadPng();
        } finally {
          setIsCopyingImage(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error copying image:', err);
      setIsCopyingImage(false);
    }
  };

  // 3. Print via isolated iframe (100% full-bleed A5)
  const handlePrint = () => {
    const previewEl = document.getElementById('invoice-preview-capture');
    if (!previewEl) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const clone = previewEl.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.margin = '0 auto';
    clone.style.position = 'relative';

    let stylesHtml = '';
    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${invoice.invoiceNumber || 'RumahBalon'}</title>
  ${stylesHtml}
  <style>
    @page {
      size: 148mm 210mm;
      margin: 0mm !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 148mm !important;
      height: 210mm !important;
      background: #fff9f5 !important;
    }
    .print-area {
      width: 148mm !important;
      height: 210mm !important;
      max-width: 148mm !important;
      max-height: 210mm !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body class="light">
  ${clone.outerHTML}
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 400);
  };

  // 4. Send via WhatsApp (Quick direct share with inline fallback, no native prompt)
  const handleSendWhatsApp = async (overridePhone?: string) => {
    const rawPhone = overridePhone !== undefined ? overridePhone : (customPhone || invoice.clientPhone || '');
    const formattedPhone = formatWhatsAppPhone(rawPhone);

    if (!formattedPhone && !showPhoneEditor) {
      setShowPhoneEditor(true);
      return;
    }

    const isPaid = invoice.status === 'paid';
    const dpPaid = typeof invoice.dpPaidAmount === 'number' && invoice.dpPaidAmount > 0
      ? invoice.dpPaidAmount
      : invoice.status === 'dp_paid'
      ? (invoice.dpAmount || Math.round(invoice.total * 0.3))
      : 0;
    const hasDpPaid = dpPaid > 0 || isPaid;
    const remainingAmount = typeof invoice.remainingAmount === 'number'
      ? invoice.remainingAmount
      : Math.max(0, invoice.total - dpPaid);

    const dpLine = hasDpPaid
      ? `💳 *DP Diterima:* ${formatRupiah(dpPaid)}\n⏳ *Sisa Tagihan (Pelunasan H-1):* *${isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}*`
      : `💳 *Min DP 30%:* ${formatRupiah(Math.round(invoice.total * 0.3))}`;

    const itemsSummary = (invoice.items || [])
      .map((it, idx) => `  ${idx + 1}. ${it.description} (${it.quantity || 1} pcs)`)
      .join('\n');

    const message = `Halo kak ${invoice.clientName || 'Pelanggan'}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 *No. Invoice:* #${invoice.invoiceNumber}\n📅 *Tanggal Acara:* ${formatDateIndo(invoice.bookingDate)}\n⏰ *Waktu:* ${invoice.eventTime || '14:00'} WIB (Setup: ${invoice.setupTime || '11:00'} WIB)\n📍 *Lokasi:* ${invoice.venue || invoice.clientAddress || '—'}\n\n📦 *Rincian Pesanan:*\n${itemsSummary || '  (Sesuai invoice)'}\n\n💰 *Total Tagihan:* *${formatRupiah(invoice.total)}*\n${dpLine}\n\nTransfer ke Rekening:\n🏦 *${invoice.bankName} ${invoice.bankAccountNumber}* a/n *${invoice.bankAccountName}*\n\n(File cetak invoice resmi juga terlampir). Terima kasih kak! ✨`;

    try {
      await navigator.clipboard.writeText(message);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 3500);
    } catch {
      // ignore
    }

    // Also auto-download PNG so admin can immediately attach it to WhatsApp
    handleDownloadPng();

    const encoded = encodeURIComponent(message);
    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
    setShowPhoneEditor(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:w-[96vw] max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col p-3 sm:p-6 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                <Printer className="w-5 h-5" />
              </span>
              <span>Preview Cetak Invoice A5 #{invoice.invoiceNumber}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client: <span className="font-semibold text-foreground">{invoice.clientName || 'Tanpa Nama'}</span> • Acara: <span className="font-semibold text-foreground">{formatDateIndo(invoice.bookingDate) || '—'}</span> • Format A5 (148 × 210 mm)
            </p>
          </div>

          {/* Action Toolbar with Mobile Horizontal Touch Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full touch-pan-x">
            {copiedNotice && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4d3085] dark:text-[#c4b5fd] bg-[#4d3085]/10 px-2.5 py-1 rounded-xl border border-[#4d3085]/30">
                <Check className="w-3.5 h-3.5 text-[#f370a8]" />
                Gambar diunduh & teks pesan disalin!
              </span>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.05).toFixed(2))))}
                aria-label="Perkecil Ukuran Preview"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono font-bold w-10 text-center text-foreground">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScale((s) => Math.min(1.2, Number((s + 0.05).toFixed(2))))}
                aria-label="Perbesar Ukuran Preview"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Copy Image to Clipboard */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyImageToClipboard}
              disabled={isCopyingImage}
              aria-label="Salin Gambar Invoice ke Clipboard untuk langsung dipaste di WhatsApp"
              className={`h-9 px-3 text-xs rounded-xl border-border font-bold transition-all hover:scale-105 ${
                copiedImageSuccess
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'text-foreground hover:bg-muted'
              }`}
              title="Salin gambar A5 ke clipboard (langsung Ctrl+V di WhatsApp Web)"
            >
              {isCopyingImage ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : copiedImageSuccess ? (
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1.5 text-[#f370a8]" />
              )}
              <span>{copiedImageSuccess ? 'Gambar Tersalin!' : 'Salin Gambar'}</span>
            </Button>

            {/* PNG */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPng}
              disabled={isGeneratingImage}
              aria-label="Unduh Invoice dalam Format Gambar PNG"
              className="h-9 px-3 text-xs rounded-xl border-border text-foreground hover:bg-muted font-bold transition-all hover:scale-105"
            >
              {isGeneratingImage ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <FileImage className="w-3.5 h-3.5 mr-1.5 text-[#4d3085] dark:text-[#c4b5fd]" />
              )}
              PNG
            </Button>

            {/* PDF */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              aria-label="Unduh Invoice dalam Format PDF A5 Resmi"
              className="h-9 px-3 text-xs rounded-xl border-border text-foreground hover:bg-muted font-bold transition-all hover:scale-105"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5 text-[#f370a8]" />
              )}
              PDF A5
            </Button>

            {/* Print */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              aria-label="Cetak Lembar Invoice Ukuran Kertas A5"
              className="h-9 px-3 text-xs rounded-xl border-border text-foreground hover:bg-muted font-bold transition-all hover:scale-105"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-foreground" />
              Cetak A5
            </Button>

            {/* Send WhatsApp (P2 Solved) */}
            <Button
              type="button"
              size="sm"
              onClick={() => handleSendWhatsApp()}
              aria-label="Kirim Rincian Tagihan Invoice ke WhatsApp Klien"
              className="h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-emerald-500 to-[#4d3085] hover:opacity-95 text-white font-extrabold shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Inline WhatsApp Phone Input Bar (P2: No Native Prompt) */}
        {showPhoneEditor && (
          <div className="p-3 my-1 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-foreground">
                Kirim ke No. WhatsApp Pelanggan:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                aria-label="Nomor WhatsApp Pelanggan"
                className="h-8 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-mono flex-1 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleSendWhatsApp(customPhone)}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Kirim
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPhoneEditor(false)}
                className="h-8 px-2 rounded-xl text-muted-foreground hover:text-foreground text-xs"
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Modal Body: Scrollable Canvas Sheet */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start bg-slate-200/50 dark:bg-zinc-950/60 rounded-2xl border border-border/80 my-2 shadow-inner">
          <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Format Standar Kertas A5 (560px × 794px • 148 × 210 mm) Siap Cetak</span>
          </div>

          <div className="p-2 sm:p-4 flex justify-center">
            <InvoicePreview data={invoice} scale={scale} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
