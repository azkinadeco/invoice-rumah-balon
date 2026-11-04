'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { InvoiceData } from '@/types/invoice';
import { InventoryItem, DispatchedProperty } from '@/types/inventory';
import { formatDateIndo, formatRupiah, formatWhatsAppPhone } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Printer,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  PartyPopper,
  CheckSquare,
  Share2,
  X,
  Phone,
  Boxes,
  Plus,
  Trash2,
  Check,
  Package,
  Search,
  Download,
  FileImage,
  Loader2,
  Edit,
  MoreHorizontal,
} from 'lucide-react';

interface CrewDispatchSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
  inventoryItems?: InventoryItem[];
  onUpdateInvoice?: (updated: InvoiceData) => void;
}

// html2canvas can't parse oklch()/lab() (Tailwind v4 colors). Resolve any CSS color to plain rgba().
let colorCtx: CanvasRenderingContext2D | null = null;
const toRgba = (value: string): string => {
  if (!value || value === 'transparent' || value.startsWith('rgb')) return value;
  colorCtx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!colorCtx) return value;
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = value;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
};

const COLOR_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'fill',
  'stroke',
] as const;

export const CrewDispatchSheetModal: React.FC<CrewDispatchSheetModalProps> = ({
  open,
  onOpenChange,
  invoice,
  inventoryItems = [],
  onUpdateInvoice,
}) => {
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [customPropName, setCustomPropName] = useState('');
  const [propQty, setPropQty] = useState(1);
  const [stockCategoryTab, setStockCategoryTab] = useState<'all' | 'balon' | 'properti' | 'alat'>('all');
  const [stockSearch, setStockSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputText, setNoteInputText] = useState('');

  // Filter master stock items for picking
  const filteredStock = useMemo(() => {
    return (inventoryItems || []).filter((it) => {
      if (stockCategoryTab === 'balon' && it.category !== 'balon') return false;
      if (stockCategoryTab === 'properti' && it.category !== 'properti') return false;
      if (
        stockCategoryTab === 'alat' &&
        it.category !== 'alat' &&
        it.category !== 'listrik' &&
        it.category !== 'aksesoris'
      )
        return false;
      if (stockSearch.trim()) {
        const q = stockSearch.toLowerCase();
        return (
          it.name.toLowerCase().includes(q) ||
          (it.balloonColor && it.balloonColor.toLowerCase().includes(q)) ||
          (it.location && it.location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [inventoryItems, stockCategoryTab, stockSearch]);

  if (!invoice) return null;

  // Canvas capture for sheet
  const captureSheetCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const element = document.getElementById('crew-dispatch-sheet');
    if (!element) return null;

    const { default: html2canvas } = await import('html2canvas');

    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');

        if (clonedEl) {
          // Bake computed colors from the live element into the clone as inline rgba()
          const liveNodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];
          const cloneNodes = [clonedEl, ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*'))];
          liveNodes.forEach((live, idx) => {
            const clone = cloneNodes[idx];
            if (!clone) return;
            const cs = getComputedStyle(live);
            COLOR_PROPS.forEach((prop) => {
              clone.style.setProperty(prop, toRgba(cs.getPropertyValue(prop)), 'important');
            });
            clone.style.setProperty('box-shadow', 'none', 'important');
            clone.style.setProperty('background-image', 'none', 'important');
          });

          // Paper checkboxes are print-only; reveal them, hide interactive/screen-only UI
          clonedEl.querySelectorAll<HTMLElement>('[data-print-box]').forEach((el) => {
            el.style.setProperty('display', 'inline-block', 'important');
          });
          clonedEl.querySelectorAll<HTMLElement>('.no-print').forEach((el) => {
            el.style.setProperty('display', 'none', 'important');
          });

          clonedEl.style.transform = 'none';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.setProperty('border-color', '#d4d4d8', 'important');
        }
      },
    });
  };

  // Download Sheet as High-Res PDF A4
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 100));

      const { buildCrewSheetPdf } = await import('@/lib/crewSheetPdf');
      const pdfBlob = await buildCrewSheetPdf(invoice);
      const fileName = `Lembar_Kerja_Crew_#${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}.pdf`;

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
      alert('Gagal mendownload PDF otomatis. Mencetak via cetak browser...');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download Sheet as PNG Image
  const handleDownloadPng = async () => {
    try {
      setIsGeneratingImage(true);
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await captureSheetCanvas();
      if (!canvas) {
        alert('Gagal mengambil gambar lembar kerja.');
        return;
      }

      const link = document.createElement('a');
      link.download = `Lembar_Kerja_Crew_#${invoice.invoiceNumber || 'RumahBalon'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Gagal mendownload gambar.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Print via isolated iframe
  const handlePrint = () => {
    const previewEl = document.getElementById('crew-dispatch-sheet');
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

    let stylesHtml = '';
    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lembar Kerja #${invoice.invoiceNumber || 'RumahBalon'}</title>
  ${stylesHtml}
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #000000 !important;
    }
    #crew-dispatch-sheet {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      background: white !important;
      color: black !important;
    }
  </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
  ${clone.outerHTML}
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 400);
  };

  // Add Item from Inventory or Custom to Dispatched Properties
  const handleAddDispatchedProperty = () => {
    let name = customPropName.trim();
    let category = 'properti';
    let unit = 'Unit';
    let balloonType: string | undefined = undefined;
    let balloonSize: string | undefined = undefined;

    if (selectedInventoryId) {
      const found = inventoryItems.find((i) => i.id === selectedInventoryId);
      if (found) {
        name = found.name;
        category = found.category;
        unit = found.unit;
        balloonType = found.balloonType;
        balloonSize = found.balloonSize;
      }
    }

    if (!name) return;

    const newProp: DispatchedProperty = {
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      inventoryItemId: selectedInventoryId || undefined,
      name,
      category,
      balloonType,
      balloonSize,
      quantity: Math.max(1, propQty),
      unit,
      checkedOut: false,
      checkedIn: false,
    };

    const updatedProps = [...(invoice.dispatchedProperties || []), newProp];
    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        dispatchedProperties: updatedProps,
        updatedAt: new Date().toISOString(),
      });
    }

    setSelectedInventoryId('');
    setCustomPropName('');
    setPropQty(1);
    setIsAddingProperty(false);
  };

  // Toggle Checked Out (Packing) or Checked In (Kembali)
  const handleTogglePropertyCheck = (propId: string, field: 'checkedOut' | 'checkedIn') => {
    const updatedProps = (invoice.dispatchedProperties || []).map((p) => {
      if (p.id !== propId) return p;
      return { ...p, [field]: !p[field] };
    });

    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        dispatchedProperties: updatedProps,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Remove Dispatched Property
  const handleRemoveDispatchedProperty = (propId: string) => {
    const updatedProps = (invoice.dispatchedProperties || []).filter((p) => p.id !== propId);
    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        dispatchedProperties: updatedProps,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Update property note (e.g. damage/return condition notes)
  const handleUpdatePropertyNote = (propId: string, notes: string) => {
    const updatedProps = (invoice.dispatchedProperties || []).map((p) => {
      if (p.id !== propId) return p;
      return { ...p, notes };
    });

    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        dispatchedProperties: updatedProps,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingNoteId(null);
  };

  const handleShareCrewWA = () => {
    const orderItemsText = (invoice.items || [])
      .map((it, idx) => `${idx + 1}. [ ] ${it.quantity || 1}x ${it.description}`)
      .join('%0A');

    const warehousePropsText =
      (invoice.dispatchedProperties || []).length > 0
        ? `%0A%0A🛠️ *PROPERTI & ALAT GUDANG YANG WAJIB DIBAWA:*%0A` +
          (invoice.dispatchedProperties || [])
            .map(
              (p, idx) =>
                `${idx + 1}. [${p.checkedOut ? '✓' : ' '}] ${p.quantity}x ${p.name} (${p.unit || 'Unit'})`
            )
            .join('%0A')
        : '';

    const crewLine = invoice.assignedCrew ? `• *Petugas / Crew:* ${invoice.assignedCrew}%0A` : '';
    const brief = `Halo Tim Dekor Rumah Balon! 🎈👷‍♂️%0A%0A📋 *SURAT TUGAS & CHECKLIST LAPANGAN:*%0A• *Client:* ${invoice.clientName || 'Pelanggan'} (#${invoice.invoiceNumber})%0A• *No. WA Client:* ${invoice.clientPhone || '—'}%0A${crewLine}• *Hari/Tanggal:* ${invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '—'}%0A• *Jam Mulai Acara:* ${invoice.eventTime || '14:00'} WIB${invoice.eventEndTime ? ' - ' + invoice.eventEndTime + ' WIB' : ''}%0A• *Jam Setup / Loading Balon:* ${invoice.setupTime || '11:00'} WIB%0A• *Lokasi / Venue:* ${invoice.venue || invoice.clientAddress || 'Sesuai arahan'}%0A• *Tema / Konsep Balon:* ${invoice.themeNote || 'Sesuai invoice'}%0A%0A📦 *DAFTAR ITEM / PAKET PESANAN:*%0A${orderItemsText}${warehousePropsText}%0A%0A${invoice.crewNote ? '⚠️ *Instruksi Khusus Crew:* ' + invoice.crewNote + '%0A%0A' : ''}Mohon tim standby tepat waktu dan periksa kelengkapan properti sebelum berangkat. Terima kasih! ✨`;
    window.open(`https://wa.me/?text=${brief}`, '_blank');
  };

  const dispatchedProps = invoice.dispatchedProperties || [];
  const checkedOutCount = dispatchedProps.filter((p) => p.checkedOut).length;
  const checkedInCount = dispatchedProps.filter((p) => p.checkedIn).length;
  const isAllPacked = dispatchedProps.length > 0 && checkedOutCount === dispatchedProps.length;
  const isAllReturned = dispatchedProps.length > 0 && checkedInCount === dispatchedProps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:w-[96vw] max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-3xl bg-card border-0 sm:border border-border shadow-2xl">
        {/* Modal Top Header (Screen Only) */}
        <div className="no-print p-3 sm:p-5 border-b border-border bg-gradient-to-r from-card via-[#4d3085]/5 to-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#4d3085] to-[#f370a8] flex items-center justify-center text-white shadow-xs shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-extrabold text-foreground">
                    Lembar Kerja & Checklist Crew
                  </DialogTitle>
                  {isAllReturned ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                      Bongkaran Selesai ✨
                    </span>
                  ) : isAllPacked ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-[#4d3085]/15 text-[#4d3085] dark:text-[#c4b5fd]">
                      Siap Berangkat (100% Packed) 🚀
                    </span>
                  ) : dispatchedProps.length > 0 ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      {checkedOutCount}/{dispatchedProps.length} Siap
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Job Order #{invoice.invoiceNumber} • {invoice.clientName}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-2 sm:pr-8">
            {/* Primary: PDF A4 */}
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isGeneratingImage}
              aria-label="Unduh lembar kerja format PDF A4"
              className="flex-1 sm:flex-none h-11 sm:h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white font-bold shadow-md shadow-[#f370a8]/20 transition-all active:scale-95"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Unduh PDF A4
            </Button>

            {/* Secondary: Kirim WA Crew */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareCrewWA}
              aria-label="Kirim lembar tugas dan checklist ke WhatsApp Crew"
              className="flex-1 sm:flex-none h-11 sm:h-9 px-3 rounded-xl border-border bg-card hover:bg-muted text-xs font-bold text-[#f370a8] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim WA Crew</span>
            </Button>

            {/* Tertiary: PNG & Cetak */}
            <Popover>
              <PopoverTrigger
                type="button"
                aria-label="Opsi ekspor lainnya"
                className="h-11 w-11 sm:h-9 sm:w-9 rounded-xl border border-border text-foreground hover:bg-muted flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5 rounded-2xl">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isGeneratingImage || isGeneratingPdf}
                  aria-label="Unduh lembar kerja format PNG"
                  className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileImage className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                  )}
                  <span>Unduh PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  aria-label="Cetak lembar kerja crew lapangan"
                  className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak A4</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Scrollable Printable A4 Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-muted/20">
          <div
            id="crew-dispatch-sheet"
            className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white text-zinc-900 shadow-lg font-sans"
          >
            {/* Sheet Official Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-zinc-900 gap-4">
              <div className="space-y-1">
                <div className="relative w-36 h-10">
                  <Image
                    src="/images/logo.png"
                    alt="Rumah Balon"
                    fill
                    sizes="150px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Professional Balloon & Party Decoration
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-lg bg-[#4d3085] text-white text-xs font-black uppercase tracking-wider">
                  SURAT TUGAS & CHECKLIST
                </span>
                <p className="text-xs font-mono font-bold text-zinc-700 mt-1">
                  NO. JOB: #{invoice.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Event & Job Meta Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-zinc-200 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Pelanggan / Pemesan
                  </span>
                  <span className="font-extrabold text-sm text-zinc-900 block mt-0.5">
                    {invoice.clientName || '—'}
                  </span>
                  {invoice.clientPhone ? (
                    <a
                      href={`https://wa.me/${formatWhatsAppPhone(invoice.clientPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Hubungi WhatsApp pelanggan: ${invoice.clientPhone}`}
                      className="text-zinc-600 hover:text-emerald-700 font-mono text-[11px] mt-1 flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-600 inline" />
                      <span>{invoice.clientPhone}</span>
                    </a>
                  ) : (
                    <div className="text-zinc-400 font-mono text-[11px] mt-0.5">
                      WhatsApp: —
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Lokasi / Venue Pemasangan
                  </span>
                  <div className="font-bold text-zinc-900 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#f370a8] shrink-0 mt-0.5" />
                    <span>{invoice.venue || invoice.clientAddress || 'Lokasi belum ditentukan'}</span>
                  </div>
                </div>

                {invoice.assignedCrew && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      Petugas / Crew yang Bertugas
                    </span>
                    <div className="font-extrabold text-xs text-[#4d3085] flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-[#f370a8]" />
                      <span>{invoice.assignedCrew}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200 self-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Jadwal Hari & Tanggal Acara
                  </span>
                  <span className="font-extrabold text-sm text-[#4d3085] block mt-0.5">
                    {invoice.bookingDate ? formatDateIndo(invoice.bookingDate) : '—'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-zinc-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Jam Setup Balon
                    </span>
                    <span className="font-mono font-black text-xs text-zinc-900">
                      {invoice.setupTime === '00:00' ? '—' : `${invoice.setupTime || '11:00'} WIB`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Jam Acara Mulai
                    </span>
                    <span className="font-mono font-black text-xs text-zinc-900">
                      {invoice.eventTime || '14:00'} WIB
                    </span>
                  </div>
                </div>

                {invoice.eventEndTime && (
                  <div className="text-[10px] text-zinc-500">
                    Perkiraan Selesai / Bongkar: <span className="font-mono font-bold text-zinc-800">{invoice.eventEndTime} WIB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tema & Konsep Balon */}
            {(invoice.themeNote || invoice.items?.[0]?.description) && (
              <div className="py-3 border-b border-zinc-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                  Tema & Konsep Balon
                </span>
                <p className="font-bold text-zinc-900 mt-0.5">
                  {invoice.themeNote || invoice.items[0].description}
                </p>
              </div>
            )}

            {/* Checklist Table 1: Item / Paket Pesanan Client */}
            <div className="py-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#4d3085] shrink-0" />
                  1. Paket & Item Pesanan Client
                </h4>
                <span className="text-[10px] text-zinc-500 italic pl-5 sm:pl-0">
                  Centang [✓] saat packing & setelah bongkar
                </span>
              </div>

              <div className="rounded-xl border border-zinc-300 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-600 border-b border-zinc-300">
                    <tr>
                      <th className="p-2 w-14 text-center">Bawa</th>
                      <th className="p-2">Deskripsi Layanan / Item</th>
                      <th className="p-2 w-14 text-center">Qty</th>
                      <th className="p-2 w-16 text-center">Kembali</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {invoice.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-zinc-50/50 align-middle">
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block w-4 h-4 border-2 border-zinc-400 rounded-sm align-middle" />
                        </td>
                        <td className="py-2.5 px-2 font-medium text-zinc-900 whitespace-pre-line">
                          {it.description}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-zinc-800">
                          {it.quantity || 1}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block w-4 h-4 border-2 border-zinc-400 rounded-sm align-middle" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checklist Table 2: Properti & Alat Gudang (Terkoneksi ke Inventory) */}
            <div className="py-3 space-y-2.5 border-t border-zinc-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                    2. Alat & Properti Gudang
                    <span className="normal-case tracking-normal text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#4d3085]">
                      {dispatchedProps.length} item
                    </span>
                  </h4>
                  <p className="no-print text-[10px] text-zinc-500 pl-5">
                    Checklist lapangan, tidak memotong saldo stok master.
                  </p>
                </div>

                {/* Tombol Ambil dari Stok Gudang (Screen Only) */}
                <div className="no-print">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingProperty((p) => !p)}
                    className="h-9 w-full sm:w-auto px-3 text-[11px] font-bold text-[#4d3085] rounded-lg border-dashed border-[#4d3085]/40 hover:bg-[#4d3085]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#f370a8]" />
                    <span>Ambil dari Stok Gudang</span>
                  </Button>
                </div>
              </div>

              {/* Add Property Selector Panel (Screen Only) */}
              {isAddingProperty && (
                <div className="no-print rounded-2xl bg-zinc-50 border border-zinc-300 text-zinc-900 text-xs overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200 bg-white">
                    <span className="font-bold text-sm">Tambah dari Stok Gudang</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingProperty(false)}
                      className="text-zinc-500 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      aria-label="Tutup panel tambah properti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-3">
                    {/* 1. Cari & filter kategori */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={stockSearch}
                          onChange={(e) => setStockSearch(e.target.value)}
                          placeholder="Cari barang gudang..."
                          className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#4d3085]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                          { id: 'all', label: 'Semua' },
                          { id: 'properti', label: 'Properti / Arch' },
                          { id: 'balon', label: 'Stok Balon' },
                          { id: 'alat', label: 'Pompa & Alat' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStockCategoryTab(tab.id as any)}
                            className={`h-8 px-3 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                              stockCategoryTab === tab.id
                                ? 'bg-[#4d3085] text-white border-[#4d3085]'
                                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Pilih barang dari daftar */}
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-300 bg-white divide-y divide-zinc-200">
                      {filteredStock.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 italic">Tidak ada barang yang cocok.</div>
                      ) : (
                        filteredStock.map((invIt) => {
                          const picked = selectedInventoryId === invIt.id;
                          return (
                            <button
                              key={invIt.id}
                              type="button"
                              onClick={() => {
                                setSelectedInventoryId(picked ? '' : invIt.id);
                                setCustomPropName('');
                              }}
                              aria-pressed={picked}
                              className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                picked ? 'bg-[#4d3085]/10' : 'hover:bg-zinc-50'
                              }`}
                            >
                              <span className="min-w-0">
                                <span className="block font-semibold text-zinc-900 truncate">{invIt.name}</span>
                                <span className="block text-[10px] text-zinc-500 truncate">
                                  Rak: {invIt.location || 'Gudang'}
                                </span>
                              </span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-mono font-bold text-zinc-700">
                                  {invIt.totalStock} {invIt.unit}
                                </span>
                                <span
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    picked ? 'border-[#4d3085] bg-[#4d3085] text-white' : 'border-zinc-300'
                                  }`}
                                >
                                  {picked && <Check className="w-2.5 h-2.5" />}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* 3. Alternatif: ketik manual */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                        Tidak ada di daftar? Ketik manual
                      </label>
                      <input
                        type="text"
                        value={customPropName}
                        onChange={(e) => {
                          setCustomPropName(e.target.value);
                          if (e.target.value) setSelectedInventoryId('');
                        }}
                        placeholder="Misal: Blower Balon Cadangan / Tali Rafia"
                        className="w-full h-10 px-3 text-xs rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#4d3085]"
                      />
                    </div>

                    {/* 4. Jumlah & tambah */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center rounded-xl border border-zinc-300 bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => setPropQty((q) => Math.max(1, q - 1))}
                          aria-label="Kurangi jumlah"
                          className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-l-xl cursor-pointer"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={propQty}
                          onChange={(e) => setPropQty(Math.max(1, Number(e.target.value) || 1))}
                          aria-label="Jumlah"
                          className="w-12 h-10 text-center text-sm font-mono font-bold bg-transparent text-zinc-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPropQty((q) => q + 1)}
                          aria-label="Tambah jumlah"
                          className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 rounded-r-xl cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddDispatchedProperty}
                        disabled={!selectedInventoryId && !customPropName.trim()}
                        className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah ke Checklist
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of Dispatched Properties */}
              <div className="rounded-xl border border-zinc-300 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-600 border-b border-zinc-300">
                    <tr>
                      <th className="p-2 w-14 text-center">Bawa</th>
                      <th className="p-2">Nama Properti & Alat Gudang</th>
                      <th className="p-2 w-16 text-center">Jumlah</th>
                      <th className="p-2 w-16 text-center">Kembali</th>
                      <th className="no-print p-2 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {dispatchedProps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-zinc-400 italic">
                          Belum ada properti atau alat gudang yang ditambahkan ke checklist ini.
                          <span className="no-print block text-[11px] text-[#4d3085] font-semibold mt-1">
                            Klik &quot;Ambil dari Stok Gudang&quot; di atas untuk menghubungkan pompa, tangga, atau arch besi.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      dispatchedProps.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50">
                          {/* Centang Bawa / Packing */}
                          <td className="p-1 sm:p-2 text-center">
                            {/* Interactive on screen with 40px touch target & ARIA checkbox */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={Boolean(p.checkedOut)}
                              onClick={() => handleTogglePropertyCheck(p.id, 'checkedOut')}
                              aria-label={`Centang packing keluar: ${p.name}`}
                              className="no-print w-10 h-10 mx-auto flex items-center justify-center cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg outline-none"
                              title="Klik untuk centang saat packing berangkat"
                            >
                              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${p.checkedOut ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-400 group-hover:border-emerald-500'}`}>
                                {p.checkedOut && <Check className="w-3.5 h-3.5 font-bold" />}
                              </span>
                            </button>
                            {/* Print box for paper checking */}
                            <span data-print-box className="hidden print:inline-block w-4 h-4 border-2 border-zinc-400 rounded-sm" />
                          </td>

                          {/* Nama Properti */}
                          <td className="p-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-zinc-900">{p.name}</span>
                              {p.balloonType && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                                  {p.balloonType}
                                </span>
                              )}
                              {p.balloonSize && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                                  {p.balloonSize.replace('_inch', '"')}
                                </span>
                              )}
                            </div>
                            {p.category && !p.balloonType && (
                              <span className="text-[10px] text-zinc-500 uppercase tracking-tight block">
                                Kategori: {p.category}
                              </span>
                            )}

                            {/* Return Condition / Damage Notes */}
                            {editingNoteId === p.id ? (
                              <div className="no-print mt-1.5 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={noteInputText}
                                  onChange={(e) => setNoteInputText(e.target.value)}
                                  placeholder="Misal: Kaki stand bengkok / Normal"
                                  className="h-6 text-[10px] px-2 rounded border border-border bg-white text-zinc-900 flex-1 outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdatePropertyNote(p.id, noteInputText);
                                    if (e.key === 'Escape') setEditingNoteId(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePropertyNote(p.id, noteInputText)}
                                  className="h-6 px-2 text-[10px] bg-[#4d3085] text-white rounded font-bold hover:opacity-90 cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="h-6 px-1.5 text-[10px] text-zinc-500 hover:text-zinc-800 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : p.notes ? (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  ⚠️ Catatan: {p.notes}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(p.id);
                                    setNoteInputText(p.notes || '');
                                  }}
                                  className="no-print text-[10px] text-zinc-400 hover:text-[#4d3085] underline cursor-pointer"
                                  title="Edit catatan kondisi"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(p.id);
                                  setNoteInputText('');
                                }}
                                className="no-print text-[10px] text-zinc-400 hover:text-[#4d3085] hover:underline mt-0.5 block cursor-pointer"
                              >
                                + Catat Kondisi Barang
                              </button>
                            )}
                          </td>

                          {/* Qty */}
                          <td className="p-2 text-center font-mono font-bold text-zinc-800">
                            {p.quantity} {p.unit || 'Unit'}
                          </td>

                          {/* Centang Kembali */}
                          <td className="p-1 sm:p-2 text-center">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={Boolean(p.checkedIn)}
                              onClick={() => handleTogglePropertyCheck(p.id, 'checkedIn')}
                              aria-label={`Centang pengembalian ke gudang: ${p.name}`}
                              className="no-print w-10 h-10 mx-auto flex items-center justify-center cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg outline-none"
                              title="Klik untuk centang saat barang kembali ke gudang"
                            >
                              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${p.checkedIn ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-400 group-hover:border-blue-500'}`}>
                                {p.checkedIn && <Check className="w-3.5 h-3.5 font-bold" />}
                              </span>
                            </button>
                            <span data-print-box className="hidden print:inline-block w-4 h-4 border-2 border-zinc-400 rounded-sm" />
                          </td>

                          {/* Aksi Hapus (Screen Only) */}
                          <td className="no-print p-1 sm:p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDispatchedProperty(p.id)}
                              aria-label={`Hapus ${p.name} dari checklist`}
                              className="w-10 h-10 mx-auto flex items-center justify-center text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus dari checklist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crew Instructions */}
            {invoice.crewNote && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Instruksi / Catatan Khusus untuk Tim Lapangan:
                </span>
                <p className="text-amber-950 font-medium whitespace-pre-line">
                  {invoice.crewNote}
                </p>
              </div>
            )}

            {/* Signatures & Handover Footer */}
            <div className="grid grid-cols-2 gap-10 mt-6 pt-5 border-t border-zinc-300 text-center text-xs break-inside-avoid">
              {['PIC Workshop / Dispatcher', 'Koordinator Crew Lapangan'].map((role) => (
                <div key={role}>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{role}</p>
                  {/* Signature space */}
                  <div className="h-20" />
                  <div className="border-t border-zinc-500 pt-1.5 text-[10px] text-zinc-500">
                    Nama jelas &amp; tanda tangan
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <DialogFooter className="no-print mx-0 mb-0 rounded-none px-4 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            Tips: Checklist tersimpan otomatis dan bisa dicentang langsung di HP atau dicetak ke kertas.
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-11 sm:h-9 w-full sm:w-auto px-4 rounded-xl border border-border"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
