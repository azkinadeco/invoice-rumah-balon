'use client';

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData } from '@/types/invoice';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Download,
  Printer,
  FilePlus,
  Loader2,
  FileImage,
  Send,
  Check,
  Sparkles,
} from 'lucide-react';

interface InvoiceToolbarProps {
  invoice: InvoiceData;
  onNew: () => void;
}

export const InvoiceToolbar: React.FC<InvoiceToolbarProps> = ({
  invoice,
  onNew,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // 1. Download as High-Res PDF
  const handleDownloadPdf = async () => {
    const element = document.getElementById('invoice-preview-capture');
    if (!element) return;

    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff9f5',
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-preview-capture');
          if (el) {
            el.style.transform = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      const fileName = `Invoice_${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF. Silakan gunakan fitur Cetak / Print sebagai alternatif.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Download as PNG image
  const handleDownloadPng = async () => {
    const element = document.getElementById('invoice-preview-capture');
    if (!element) return;

    try {
      setIsGeneratingImage(true);
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#fff9f5',
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-preview-capture');
          if (el) {
            el.style.transform = 'none';
          }
        },
      });

      const link = document.createElement('a');
      link.download = `Invoice_${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Gagal mendownload gambar.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 3. Print
  const handlePrint = () => {
    window.print();
  };

  // 4. Send via WhatsApp (Quick Text + Auto PNG Download)
  const handleSendWhatsApp = async () => {
    const phone = invoice.clientPhone.replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }

    const message = `Halo kak ${invoice.clientName || ''}! 😊🎈\n\nBerikut rincian Invoice pesanan dari *Rumah Balon Decoration*:\n📄 No. Invoice: *${invoice.invoiceNumber}*\n📅 Tanggal Acara: *${formatDateIndo(invoice.bookingDate)}*\n💰 Total Tagihan: *${formatRupiah(invoice.total)}*\n💳 DP Min 30%: *${formatRupiah(Math.round(invoice.total * 0.3))}*\n\nTransfer ke Rekening:\n🏦 *${invoice.bankName} ${invoice.bankAccountNumber}* a/n *${invoice.bankAccountName}*\n\n(Foto invoice resmi juga terlampir). Terima kasih kak! ✨`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(message);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 3500);
    } catch {
      // ignore
    }

    // Auto download PNG
    handleDownloadPng();

    // Open WhatsApp
    const encoded = encodeURIComponent(message);
    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="no-print bg-card/70 backdrop-blur-xl sticky top-14 z-20 border-b border-border/70 px-4 py-2.5 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Create New Invoice */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNew}
            className="h-9 text-xs rounded-xl border-border bg-card hover:bg-accent text-foreground font-semibold shadow-2xs transition-all hover:scale-[1.02]"
          >
            <FilePlus className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
            + Buat Invoice Baru
          </Button>

          {copiedNotice && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in slide-in-from-left-2 duration-200">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Gambar diunduh & teks WA disalin ke clipboard!
            </span>
          )}
        </div>

        {/* Right Side: Export & Send Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 text-xs rounded-xl border-border hover:bg-accent text-foreground font-medium"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Cetak (Print)
          </Button>

          {/* Download PNG */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            disabled={isGeneratingImage}
            className="h-9 text-xs rounded-xl border-border hover:bg-accent text-foreground font-medium"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-muted-foreground" />
            ) : (
              <FileImage className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            )}
            Download Gambar (PNG)
          </Button>

          {/* Download PDF */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-9 text-xs rounded-xl border-border hover:bg-accent text-foreground font-medium"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-muted-foreground" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
            )}
            Download PDF
          </Button>

          {/* Send via WhatsApp (Primary CTA) */}
          <Button
            type="button"
            size="sm"
            onClick={handleSendWhatsApp}
            className="h-9 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Kirim WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};
