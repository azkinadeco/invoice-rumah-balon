'use client';

import React, { useState, useMemo } from 'react';
import { InvoiceData, ScheduleStatus } from '@/types/invoice';
import { InventoryItem } from '@/types/inventory';
import { formatDateIndo, formatRupiah, formatWhatsAppPhone } from '@/lib/format';
import { SCHEDULE_STATUS_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Eye,
  Printer,
  Edit,
  CheckCircle2,
  CalendarDays,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  TableProperties,
  RotateCcw,
  Copy,
  Check,
  Users,
  FileSpreadsheet,
  ClipboardCheck,
  Boxes,
  Package,
  X,
  MoreVertical,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScheduleEditModal } from './ScheduleEditModal';
import { CrewDispatchSheetModal } from './CrewDispatchSheetModal';
import { ScheduleStats } from './ScheduleStats';
import { ScheduleCalendarView } from './ScheduleCalendarView';

interface ScheduleBoardProps {
  invoices: InvoiceData[];
  onUpdateInvoice: (updated: InvoiceData) => void;
  onOpenNewInvoice: () => void;
  onViewInvoice: (inv: InvoiceData) => void;
  onPrintInvoice: (inv: InvoiceData) => void;
  inventoryItems?: InventoryItem[];
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_HEADER_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const ScheduleBoard: React.FC<ScheduleBoardProps> = ({
  invoices,
  onUpdateInvoice,
  onOpenNewInvoice,
  onViewInvoice,
  onPrintInvoice,
  inventoryItems = [],
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<InvoiceData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [crewSheetInvoice, setCrewSheetInvoice] = useState<InvoiceData | null>(null);
  const [crewSheetOpen, setCrewSheetOpen] = useState(false);
  const [propertyPrepFilter, setPropertyPrepFilter] = useState<'all' | 'needs_prep' | 'has_props' | 'packed'>('all');
  const [quickDateFilter, setQuickDateFilter] = useState<'all' | 'today' | 'tomorrow'>('all');

  // Month & Year for interactive calendar
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Today & Tomorrow formatted strings
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  const tomorrowStr = useMemo(() => {
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    return `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;
  }, [today]);

  // Sorted invoices with booking dates
  const sortedInvoices = useMemo(() => {
    return [...invoices]
      .filter((inv) => inv.bookingDate)
      .sort((a, b) => {
        const dateCompare = a.bookingDate.localeCompare(b.bookingDate);
        if (dateCompare !== 0) return dateCompare;
        return (a.eventTime || '00:00').localeCompare(b.eventTime || '00:00');
      });
  }, [invoices]);

  // Map of active bookings count per date string (excludes cancelled orders)
  const bookingsDateMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedInvoices.forEach((inv) => {
      if (!inv.bookingDate || inv.status === 'cancelled') return;
      map.set(inv.bookingDate, (map.get(inv.bookingDate) || 0) + 1);
    });
    return map;
  }, [sortedInvoices]);

  // Calendar days grid generation
  const calendarGrid = useMemo(() => {
    if (!isCalendarOpen) return [];

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const firstDayMonday = (firstDay + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      eventCount: number;
    }> = [];

    // Previous month filler days
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = firstDayMonday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        eventCount: bookingsDateMap.get(dateStr) || 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        eventCount: bookingsDateMap.get(dateStr) || 0,
      });
    }

    // Next month filler days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth + 2 > 12 ? 1 : viewMonth + 2;
      const nextY = viewMonth + 2 > 12 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        eventCount: bookingsDateMap.get(dateStr) || 0,
      });
    }

    return days;
  }, [isCalendarOpen, viewYear, viewMonth, bookingsDateMap, todayStr]);

  // Overall & Month Statistics (active events only, excluding cancelled orders)
  const stats = useMemo(() => {
    const activeInvoices = sortedInvoices.filter((inv) => inv.status !== 'cancelled');
    const curMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthInvoices = activeInvoices.filter((inv) => (inv.bookingDate || '').startsWith(curMonthPrefix));
    const todayCount = activeInvoices.filter((inv) => inv.bookingDate === todayStr).length;
    const tomorrowCount = activeInvoices.filter((inv) => inv.bookingDate === tomorrowStr).length;
    const inProgressCount = activeInvoices.filter(
      (inv) => inv.scheduleStatus === 'in_progress' || inv.scheduleStatus === 'ready'
    ).length;

    return {
      monthTotal: monthInvoices.length,
      today: todayCount,
      tomorrow: tomorrowCount,
      inProgress: inProgressCount,
      totalAll: activeInvoices.length,
    };
  }, [sortedInvoices, viewYear, viewMonth, todayStr, tomorrowStr]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedCalendarDate(todayStr);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    const curMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    return sortedInvoices.filter((inv) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (inv.clientName || '').toLowerCase().includes(q);
        const matchPhone = (inv.clientPhone || '').toLowerCase().includes(q);
        const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const matchVenue = (inv.venue || inv.clientAddress || '').toLowerCase().includes(q);
        const matchTheme = (inv.themeNote || '').toLowerCase().includes(q);
        const matchItems = (inv.items || []).some((it) => (it.description || '').toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchNumber && !matchVenue && !matchTheme && !matchItems) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const invStatus = inv.scheduleStatus || 'scheduled';
        if (invStatus !== statusFilter) return false;
      }

      // 3. Status Kesiapan Properti Filter
      if (propertyPrepFilter === 'needs_prep') {
        const hasProps = inv.dispatchedProperties && inv.dispatchedProperties.length > 0;
        if (hasProps) return false;
      } else if (propertyPrepFilter === 'has_props') {
        const hasProps = inv.dispatchedProperties && inv.dispatchedProperties.length > 0;
        if (!hasProps) return false;
      } else if (propertyPrepFilter === 'packed') {
        const props = inv.dispatchedProperties || [];
        if (props.length === 0) return false;
        const allPacked = props.every((p) => p.checkedOut);
        if (!allPacked) return false;
      }

      // 4. Quick Day Filter (Hari Ini / Besok)
      if (quickDateFilter === 'today') {
        if (inv.bookingDate !== todayStr) return false;
      } else if (quickDateFilter === 'tomorrow') {
        if (inv.bookingDate !== tomorrowStr) return false;
      } else if (selectedCalendarDate) {
        // 5. Calendar Selected Date filter takes priority if active
        if (inv.bookingDate !== selectedCalendarDate) return false;
      } else {
        // 6. Default: Filter to events within viewed month
        if (!(inv.bookingDate || '').startsWith(curMonthPrefix)) return false;
      }

      return true;
    });
  }, [sortedInvoices, search, statusFilter, propertyPrepFilter, quickDateFilter, selectedCalendarDate, todayStr, tomorrowStr, viewYear, viewMonth]);

  // Open Edit Schedule Modal
  const handleOpenEdit = (inv: InvoiceData) => {
    setSelectedSchedule(inv);
    setEditModalOpen(true);
  };

  // Save Schedule changes
  const handleSaveSchedule = (updatedData: {
    bookingDate: string;
    eventTime?: string;
    eventEndTime?: string;
    setupTime?: string;
    venue?: string;
    themeNote?: string;
    crewNote?: string;
    assignedCrew?: string;
    scheduleStatus?: ScheduleStatus;
  }) => {
    if (!selectedSchedule) return;
    const updated: InvoiceData = {
      ...selectedSchedule,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    onUpdateInvoice(updated);
  };

  // Quick Status changer
  const handleQuickChangeStatus = (inv: InvoiceData, newStatus: ScheduleStatus) => {
    const updated: InvoiceData = {
      ...inv,
      scheduleStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateInvoice(updated);
  };

  // Quick Mark as Paid with celebratory confetti
  const handleQuickMarkPaid = async (inv: InvoiceData) => {
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f370a8', '#4d3085', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {}

    onUpdateInvoice({
      ...inv,
      status: 'paid',
      dpPaidAmount: inv.total,
      remainingAmount: 0,
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick WhatsApp Confirmation to Client
  const generateWhatsAppMessage = (inv: InvoiceData) => {
    const phone = formatWhatsAppPhone(inv.clientPhone);
    const isPaid = inv.status === 'paid';
    const dpPaid = isPaid ? inv.total : (inv.dpPaidAmount || (inv.status === 'dp_paid' ? Math.round(inv.total * 0.3) : 0));
    const remaining = isPaid ? 0 : Math.max(0, inv.total - dpPaid);

    const paymentInfo = isPaid
      ? `%0A💰 *Status Pembayaran:* Lunas Penuh ✨`
      : dpPaid > 0
      ? `%0A💰 *Total Tagihan:* ${formatRupiah(inv.total)}%0A💳 *DP Diterima:* ${formatRupiah(dpPaid)}%0A⏳ *Sisa Tagihan (Pelunasan H-1):* ${formatRupiah(remaining)}`
      : `%0A💰 *Total Tagihan:* ${formatRupiah(inv.total)} (Min DP 30%: ${formatRupiah(Math.round(inv.total * 0.3))})`;

    const greeting = `Halo Kak ${inv.clientName || 'Pelanggan'}! %0A%0ASalam dari *Rumah Balon Decoration* 🎈%0AKami ingin mengonfirmasi jadwal pemasangan dekorasi acara Kakak:%0A%0A📅 *Tanggal:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}%0A⏰ *Jam Mulai Acara:* ${inv.eventTime || '14:00'} WIB${inv.eventEndTime ? ' - ' + inv.eventEndTime + ' WIB' : ''}%0A🎈 *Jam Setup/Loading Balon:* ${inv.setupTime || '11:00'} WIB%0A📍 *Lokasi/Venue:* ${inv.venue || inv.clientAddress || 'Sesuai kesepakatan'}%0A${inv.themeNote ? '🎨 *Tema Balon:* ' + inv.themeNote + '%0A' : ''}${paymentInfo}%0A%0AMohon konfirmasi bila ada penyesuaian jam atau arahan lokasi ya Kak. Terima kasih banyak! ✨`;
    return `https://wa.me/${phone}?text=${greeting}`;
  };

  // Quick WhatsApp Payment Reminder for H-1 balance (Tagihan Pelunasan)
  const generatePaymentReminderMessage = (inv: InvoiceData) => {
    const phone = formatWhatsAppPhone(inv.clientPhone);
    const dpPaid = inv.dpPaidAmount || (inv.status === 'dp_paid' ? Math.round(inv.total * 0.3) : 0);
    const remaining = inv.remainingAmount ?? Math.max(0, inv.total - dpPaid);

    const bankDetails = inv.bankName
      ? `🏦 *${inv.bankName} ${inv.bankAccountNumber}*\na/n *${inv.bankAccountName}*`
      : '🏦 *BCA 0115792949* a/n *YULIANA PRASETYOWATI*';

    const msg = `Halo Kak ${inv.clientName || 'Pelanggan'}! 😊🎈%0A%0ASalam hangat dari *Rumah Balon Decoration*.%0AMengingat jadwal pemasangan dekorasi acara Kakak akan loading pada:%0A%0A📅 *Hari/Tanggal:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}%0A⏰ *Jam Loading / Setup:* ${inv.setupTime || '11:00'} WIB%0A📍 *Lokasi:* ${inv.venue || inv.clientAddress || 'Sesuai kesepakatan'}%0A%0AKami ingin menginfokan untuk sisa pelunasan pesanan (#${inv.invoiceNumber}):%0A💰 *Total Tagihan:* ${formatRupiah(inv.total)}%0A💳 *DP Diterima:* ${formatRupiah(dpPaid)}%0A⏳ *Sisa Tagihan (Pelunasan H-1):* *${formatRupiah(remaining)}*%0A%0AMohon dapat melakukan transfer pelunasan ke rekening resmi kami:%0A${bankDetails}%0A%0ASetelah transfer, mohon kirimkan bukti pembayarannya ya Kak agar tim kami segera menjadwalkan loading dekorasi tepat waktu. Terima kasih banyak Kak! ✨🙏`;

    return `https://wa.me/${phone}?text=${msg}`;
  };

  // WhatsApp Dispatch Briefing to Crew / Decorators
  const generateCrewBriefMessage = (inv: InvoiceData) => {
    const crewLine = inv.assignedCrew ? `• *Petugas / Crew:* ${inv.assignedCrew}%0A` : '';
    const brief = `Halo Tim Dekor Rumah Balon! 🎈👷‍♂️%0A%0A📋 *PENUGASAN JOB DEKORASI:*%0A• *Client:* ${inv.clientName || 'Pelanggan'} (#${inv.invoiceNumber})%0A• *Tanggal:* ${inv.bookingDate ? formatDateIndo(inv.bookingDate) : '—'}%0A${crewLine}• *Jam Mulai Acara:* ${inv.eventTime || '14:00'} WIB${inv.eventEndTime ? ' - ' + inv.eventEndTime + ' WIB' : ''}%0A• *Jam Setup / Loading Balon:* ${inv.setupTime || '11:00'} WIB%0A• *Lokasi / Venue:* ${inv.venue || inv.clientAddress || 'Sesuai arahan'}%0A• *Tema / Konsep Balon:* ${inv.themeNote || 'Sesuai invoice'}%0A${inv.crewNote ? '• *Instruksi Khusus:* ' + inv.crewNote + '%0A' : ''}%0AMohon dicek kelengkapan properti & standby tepat waktu. Semangat tim! ✨`;
    return `https://wa.me/?text=${brief}`;
  };

  // Copy schedule summary to clipboard
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const handleCopyScheduleText = async () => {
    if (filteredList.length === 0) return;
    const period = selectedCalendarDate
      ? `Tanggal ${formatDateIndo(selectedCalendarDate)}`
      : `Bulan ${MONTH_NAMES_ID[viewMonth]} ${viewYear}`;

    const activeList = filteredList.filter((it) => it.status !== 'cancelled');
    const cancelledInList = filteredList.filter((it) => it.status === 'cancelled');

    let text = `📅 *AGENDA DEKORASI RUMAH BALON*\n📌 Periode: ${period}\n📊 Total: ${activeList.length} Job Aktif\n----------------------------\n`;
    
    if (activeList.length === 0) {
      text += `\n(Tidak ada acara aktif pada periode ini)\n`;
    } else {
      activeList.forEach((it, i) => {
        text += `\n${i + 1}. *${it.clientName}* (#${it.invoiceNumber})\n   🗓 ${formatDateIndo(it.bookingDate)}\n   ⏰ Acara: ${it.eventTime || '14:00'} WIB (Setup: ${it.setupTime || '11:00'} WIB)\n   📍 Lokasi: ${it.venue || it.clientAddress || '—'}\n   🎨 Tema: ${it.themeNote || it.items?.[0]?.description || '—'}\n   👷 Crew: ${it.assignedCrew || 'Belum ditugaskan'}\n   ⚡ Status: ${SCHEDULE_STATUS_CONFIG[it.scheduleStatus || 'scheduled']?.label || 'Dijadwalkan'}\n`;
      });
    }

    if (cancelledInList.length > 0) {
      text += `\n----------------------------\n❌ *PESANAN DIBATALKAN (${cancelledInList.length}):*\n`;
      cancelledInList.forEach((it) => {
        text += `• ~${it.clientName} (#${it.invoiceNumber})~ - [BATAL]\n`;
      });
    }

    text += `\n✨ *Rumah Balon Decoration Official*`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSchedule(true);
      setTimeout(() => setCopiedSchedule(false), 3000);
    } catch {
      // ignore
    }
  };

  // Export filtered schedules to Excel / CSV
  const handleExportScheduleCSV = () => {
    const filename = selectedCalendarDate
      ? `Jadwal_Dekorasi_RumahBalon_${selectedCalendarDate}.csv`
      : `Jadwal_Dekorasi_RumahBalon_${MONTH_NAMES_ID[viewMonth]}_${viewYear}.csv`;

    const headers = [
      'No Invoice',
      'Status Invoice',
      'Tanggal Acara',
      'Jam Acara',
      'Jam Setup Balon',
      'Nama Pelanggan',
      'Nomor WhatsApp',
      'Lokasi / Venue',
      'Tema / Konsep Balon',
      'Crew Bertugas',
      'Catatan Crew',
      'Status Pengerjaan',
      'Total Nilai (Rp)',
    ];

    const rows = filteredList.map((inv) => [
      `"${inv.invoiceNumber || ''}"`,
      `"${inv.status === 'cancelled' ? 'DIBATALKAN' : inv.status === 'paid' ? 'LUNAS' : inv.status === 'dp_paid' ? 'DP MASUK' : 'AKTIF'}"`,
      `"${inv.bookingDate || ''}"`,
      `"${inv.eventTime || '14:00'}${inv.eventEndTime ? ' - ' + inv.eventEndTime : ''}"`,
      `"${inv.setupTime || '11:00'}"`,
      `"${(inv.clientName || '').replace(/"/g, '""')}"`,
      `"${inv.clientPhone || ''}"`,
      `"${(inv.venue || inv.clientAddress || '').replace(/"/g, '""')}"`,
      `"${(inv.themeNote || '').replace(/"/g, '""')}"`,
      `"${(inv.assignedCrew || '').replace(/"/g, '""')}"`,
      `"${(inv.crewNote || '').replace(/"/g, '""')}"`,
      `"${SCHEDULE_STATUS_CONFIG[inv.scheduleStatus || 'scheduled']?.label || 'Dijadwalkan'}"`,
      inv.total || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format Helper for day name & date
  const getDayInfo = (dateStr: string) => {
    if (!dateStr) return { dayName: '—', dayNum: '—', monthYear: '—', isToday: false, isTomorrow: false };
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return {
      dayName: dayNames[dt.getDay()],
      dayNum: d,
      monthYear: `${monthNames[m - 1]} ${y}`,
      isToday: dateStr === todayStr,
      isTomorrow: dateStr === tomorrowStr,
    };
  };

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER CONTROLS (Ringkas, Ringan, Bisa Buka/Tutup)            */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-[#f370a8] to-[#4d3085] text-white shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              Jadwal Pesanan Client
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f370a8]/15 text-[#f370a8]">
              {stats.monthTotal} Acara Bulan {MONTH_NAMES_ID[viewMonth]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola agenda bulanan, jam mulai acara, jam setup balon, dan venue client secara rapi.
          </p>
        </div>

        {/* Action Controls in Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Buka/Tutup Kalender Tanggal Sebulan */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCalendarOpen((prev) => !prev)}
            className={cn(
              'h-9 px-3 rounded-xl border-border text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs',
              isCalendarOpen
                ? 'bg-[#f370a8] text-white border-[#f370a8]'
                : 'bg-card hover:bg-muted text-foreground'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isCalendarOpen ? 'Tutup Kalender Tanggal' : 'Buka Kalender Tanggal'}</span>
            {isCalendarOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Mode Switcher: Mode Kartu vs Mode Tabel Sebulan */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#f370a8]" />
              <span>Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TableProperties className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              <span>Tabel Sebulan</span>
            </button>
          </div>

          {/* Tambah Pesanan CTA */}
          <Button
            type="button"
            size="sm"
            onClick={onOpenNewInvoice}
            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/20 text-xs flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Pesanan</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS CARDS (Modular & Ringan)                                    */}
      {/* ===================================================================== */}
      <ScheduleStats
        stats={stats}
        currentMonthName={MONTH_NAMES_ID[viewMonth]}
        activeQuickDate={quickDateFilter}
        onFilterAll={() => {
          setQuickDateFilter('all');
          setSelectedCalendarDate(null);
        }}
        onFilterToday={() => {
          setQuickDateFilter((prev) => (prev === 'today' ? 'all' : 'today'));
          setSelectedCalendarDate(null);
        }}
        onFilterTomorrow={() => {
          setQuickDateFilter((prev) => (prev === 'tomorrow' ? 'all' : 'tomorrow'));
          setSelectedCalendarDate(null);
        }}
      />

      {/* ===================================================================== */}
      {/* 3. KALENDER SEBULAN (COLLAPSIBLE / MODULAR)                          */}
      {/* ===================================================================== */}
      {isCalendarOpen && (
        <ScheduleCalendarView
          viewYear={viewYear}
          viewMonth={viewMonth}
          monthName={MONTH_NAMES_ID[viewMonth]}
          calendarGrid={calendarGrid}
          selectedCalendarDate={selectedCalendarDate}
          todayStr={todayStr}
          onSelectDate={(dateStr) => {
            setQuickDateFilter('all');
            setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
          }}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onResetToday={handleResetToCurrentMonth}
        />
      )}

      {/* Active Calendar Date Notification */}
      {!isCalendarOpen && selectedCalendarDate && (
        <div className="p-3 rounded-2xl bg-[#f370a8]/10 border border-[#f370a8]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#f370a8] text-white">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-foreground">
              Filter Tanggal Aktif:{' '}
              <span className="text-[#f370a8] font-extrabold font-mono">
                {formatDateIndo(selectedCalendarDate)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="text-[11px] font-bold text-[#f370a8] hover:underline cursor-pointer"
            >
              Buka Kalender
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Reset ✕
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. SEARCH & STATUS FILTER BAR                                        */}
      {/* ===================================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari client, WhatsApp, venue, tema balon..."
              className="pl-9 pr-8 h-10 rounded-xl bg-background border-border text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Chips (Hari Ini & Besok) & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Day Chips */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/80">
              <button
                type="button"
                onClick={() => {
                  setQuickDateFilter('all');
                  setSelectedCalendarDate(null);
                }}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer',
                  quickDateFilter === 'all' && !selectedCalendarDate
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickDateFilter((prev) => (prev === 'today' ? 'all' : 'today'));
                  setSelectedCalendarDate(null);
                }}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1',
                  quickDateFilter === 'today'
                    ? 'bg-[#f370a8] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>Hari Ini</span>
                {stats.today > 0 && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded-full font-mono',
                      quickDateFilter === 'today' ? 'bg-white/25 text-white' : 'bg-[#f370a8]/20 text-[#f370a8]'
                    )}
                  >
                    {stats.today}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickDateFilter((prev) => (prev === 'tomorrow' ? 'all' : 'tomorrow'));
                  setSelectedCalendarDate(null);
                }}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1',
                  quickDateFilter === 'tomorrow'
                    ? 'bg-[#4d3085] text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>Besok</span>
                {stats.tomorrow > 0 && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded-full font-mono',
                      quickDateFilter === 'tomorrow' ? 'bg-white/25 text-white' : 'bg-[#4d3085]/20 text-[#4d3085] dark:text-[#c4b5fd]'
                    )}
                  >
                    {stats.tomorrow}
                  </span>
                )}
              </button>
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'scheduled', label: 'Dijadwalkan' },
                { id: 'ready', label: 'Siap Dekor' },
                { id: 'in_progress', label: 'Pengerjaan' },
                { id: 'completed', label: 'Selesai' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === s.id
                      ? 'bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyScheduleText}
              className="h-9 px-3 rounded-xl border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Salin ringkasan agenda ke clipboard untuk dibagikan ke WhatsApp grup crew"
            >
              {copiedSchedule ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#f370a8]" />
                  <span className="text-[#f370a8] font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
                  <span className="hidden sm:inline">Salin Rekap WA</span>
                  <span className="sm:hidden">Rekap WA</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportScheduleCSV}
              className="h-9 px-3 rounded-xl border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Ekspor seluruh daftar jadwal dekorasi ke file Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
              <span className="hidden sm:inline">Excel/CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>

        {/* Sub-Filters Kesiapan Properti & Balon */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-2.5 border-t border-border/60">
          <span className="font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1 text-[11px]">
            <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
            <span>Kesiapan Properti:</span>
          </span>
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'needs_prep', label: '⚠️ Belum Disiapkan (0 Properti)' },
            { id: 'has_props', label: '📦 Ada Properti Disiapkan' },
            { id: 'packed', label: '✨ 100% Siap Berangkat' },
          ].map((pf) => (
            <button
              key={pf.id}
              type="button"
              onClick={() => setPropertyPrepFilter(pf.id as any)}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border',
                propertyPrepFilter === pf.id
                  ? 'bg-[#4d3085] text-white border-[#4d3085] shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. MAIN CONTENT: MODE KARTU ATAU MODE TABEL SEBULAN                  */}
      {/* ===================================================================== */}
      {filteredList.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-card border border-border space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f370a8]/10 flex items-center justify-center text-[#f370a8]">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Tidak ada jadwal yang cocok
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {selectedCalendarDate
                ? `Tidak ada pesanan dekorasi pada tanggal ${formatDateIndo(selectedCalendarDate)}.`
                : search || statusFilter !== 'all'
                ? 'Coba ganti filter status atau cari kata kunci lain.'
                : `Belum ada pesanan dengan tanggal booking di bulan ${MONTH_NAMES_ID[viewMonth]} ${viewYear}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(Boolean(selectedCalendarDate) || Boolean(search) || statusFilter !== 'all' || quickDateFilter !== 'all' || propertyPrepFilter !== 'all') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCalendarDate(null);
                  setSearch('');
                  setStatusFilter('all');
                  setQuickDateFilter('all');
                  setPropertyPrepFilter('all');
                }}
                className="h-8 px-3 rounded-xl border-border text-xs font-semibold hover:bg-muted"
              >
                Reset Semua Filter ✕
              </Button>
            )}
            {selectedCalendarDate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCalendarDate(null)}
                className="h-8 px-3 rounded-xl border-border text-xs"
              >
                Tampilkan Seluruh Bulan
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={onOpenNewInvoice}
              className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Buat Invoice Baru
            </Button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ==================== 5A. RESPONSIVE CARDS VIEW ==================== */
        <div className="space-y-3">
          {filteredList.map((inv) => {
            const dateInfo = getDayInfo(inv.bookingDate);
            const statusConfig =
              SCHEDULE_STATUS_CONFIG[inv.scheduleStatus || 'scheduled'] ||
              SCHEDULE_STATUS_CONFIG.scheduled;

            const isCancelled = inv.status === 'cancelled';

            return (
              <div
                key={inv.id}
                className={cn(
                  'p-4 sm:p-5 rounded-3xl border transition-all duration-200 bg-card hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4',
                  isCancelled
                    ? 'opacity-65 border-dashed border-rose-300 dark:border-rose-900 bg-muted/15'
                    : dateInfo.isToday
                    ? 'border-[#f370a8] ring-2 ring-[#f370a8]/20 shadow-sm'
                    : dateInfo.isTomorrow
                    ? 'border-[#4d3085]/40 hover:border-[#4d3085]'
                    : 'border-border/80 hover:border-[#f370a8]/40'
                )}
              >
                {/* Main Content Area */}
                <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4 flex-1 w-full">
                  {/* Visual Date Badge */}
                  <div className="flex items-center justify-between sm:justify-center w-full sm:w-20 sm:flex-col rounded-2xl p-2.5 sm:p-2 border shrink-0 shadow-xs bg-muted/50 border-border">
                    <div className="flex sm:flex-col items-center gap-2 sm:gap-0">
                      <span
                        className={cn(
                          'text-[11px] sm:text-[10px] font-black uppercase tracking-wider',
                          dateInfo.isToday ? 'text-[#f370a8]' : 'text-muted-foreground'
                        )}
                      >
                        {dateInfo.dayName}
                      </span>
                      <span className="text-xl sm:text-3xl font-black font-mono leading-none sm:my-1 text-foreground">
                        {dateInfo.dayNum}
                      </span>
                      <span className="text-[11px] sm:text-[10px] font-semibold text-muted-foreground">
                        {dateInfo.monthYear}
                      </span>
                    </div>

                    {dateInfo.isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[#f370a8] text-white text-[9px] font-black uppercase tracking-wider sm:mt-1">
                        Hari Ini
                      </span>
                    )}
                    {dateInfo.isTomorrow && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4d3085] text-white text-[9px] font-bold uppercase tracking-wider sm:mt-1">
                        Besok
                      </span>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2.5 flex-1 min-w-0 w-full">
                    {/* Header Row: Client Name, Invoice #, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-foreground tracking-tight">
                          {inv.clientName || '(Tanpa Nama)'}
                        </h3>
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          #{inv.invoiceNumber}
                        </span>
                        {inv.status === 'cancelled' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Pesanan Batal ✕
                          </span>
                        ) : inv.status === 'paid' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Lunas ✨
                          </span>
                        ) : (inv.status === 'dp_paid' || (inv.dpPaidAmount && inv.dpPaidAmount > 0)) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                            DP: {formatRupiah(inv.dpPaidAmount || Math.round(inv.total * 0.3))} • Sisa {formatRupiah(inv.remainingAmount ?? Math.max(0, inv.total - (inv.dpPaidAmount || Math.round(inv.total * 0.3))))}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            Total {formatRupiah(inv.total)}
                          </span>
                        )}
                      </div>

                      <select
                        value={inv.scheduleStatus || 'scheduled'}
                        onChange={(e) => handleQuickChangeStatus(inv, e.target.value as ScheduleStatus)}
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 outline-none cursor-pointer transition-all',
                          statusConfig.badge
                        )}
                        title="Klik untuk langsung mengubah status pengerjaan acara"
                      >
                        <option value="scheduled" className="bg-card text-foreground">Dijadwalkan</option>
                        <option value="ready" className="bg-card text-foreground">Siap Dekor</option>
                        <option value="in_progress" className="bg-card text-foreground">Pengerjaan</option>
                        <option value="completed" className="bg-card text-foreground">Selesai</option>
                      </select>
                    </div>

                    {/* Time, Setup, and Venue chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Jam Acara */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background border border-border font-mono font-bold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-[#f370a8]" />
                        <span>
                          Acara: {inv.eventTime || '14:00'}
                          {inv.eventEndTime ? ` - ${inv.eventEndTime}` : ''}
                        </span>
                      </div>

                      {/* Jam Setup Loading */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#4d3085]/10 dark:bg-[#4d3085]/25 border border-[#4d3085]/20 font-mono font-bold text-[#4d3085] dark:text-[#c4b5fd]">
                        <Sparkles className="w-3.5 h-3.5 text-[#f370a8]" />
                        <span>Setup Balon: {inv.setupTime || '11:00'}</span>
                      </div>

                      {/* Lokasi / Venue */}
                      {(inv.venue || inv.clientAddress) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 text-muted-foreground max-w-full sm:max-w-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                          <span className="truncate">{inv.venue || inv.clientAddress}</span>
                        </div>
                      )}

                      {/* Crew Bertugas */}
                      {inv.assignedCrew && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#4d3085]/10 dark:bg-[#4d3085]/20 text-[#4d3085] dark:text-[#c4b5fd] border border-[#4d3085]/20 font-bold">
                          <Users className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                          <span>Crew: {inv.assignedCrew}</span>
                        </div>
                      )}
                    </div>

                    {/* Tema Balon / Request Note */}
                    {inv.themeNote && (
                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5">
                        <PartyPopper className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                        <span className="font-medium text-foreground">{inv.themeNote}</span>
                      </p>
                    )}

                    {/* Crew Note if exists */}
                    {inv.crewNote && (
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-[11px] text-muted-foreground">
                        <span className="font-bold text-[#4d3085] dark:text-[#c4b5fd]">
                          Catatan Crew:{' '}
                        </span>
                        {inv.crewNote}
                      </div>
                    )}

                    {/* Kebutuhan Properti & Stok Balon Preview */}
                    {inv.dispatchedProperties && inv.dispatchedProperties.length > 0 ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCrewSheetInvoice(inv);
                          setCrewSheetOpen(true);
                        }}
                        className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-[#4d3085]/5 to-card border border-pink-500/25 hover:border-pink-500/40 transition-all cursor-pointer group/prop space-y-1.5 shadow-2xs"
                        title="Klik untuk membuka kelola kebutuhan properti & stok balon pesanan ini"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-foreground group-hover/prop:text-[#f370a8] transition-colors">
                            <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
                            <span>Kebutuhan Properti & Balon ({inv.dispatchedProperties.length} item)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {inv.dispatchedProperties.every((p) => p.checkedIn) ? (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                                ✨ Bongkaran Selesai
                              </span>
                            ) : inv.dispatchedProperties.every((p) => p.checkedOut) ? (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-[#4d3085]/15 text-[#4d3085] dark:text-[#c4b5fd]">
                                🚀 100% Siap Berangkat
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-muted text-muted-foreground border border-border">
                                📦 {inv.dispatchedProperties.filter((p) => p.checkedOut).length}/{inv.dispatchedProperties.length} Dipacking
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold text-[#4d3085] dark:text-[#c4b5fd] group-hover/prop:underline">
                              Kelola →
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          {inv.dispatchedProperties.slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-card border border-border flex items-center gap-1 shadow-2xs"
                            >
                              <span className="font-bold text-foreground">{p.quantity}x</span>
                              <span className="truncate max-w-[120px]">{p.name}</span>
                              {p.balloonType && (
                                <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-100 text-amber-800">
                                  {String(p.balloonType)}
                                </span>
                              )}
                              {p.balloonSize && (
                                <span className="text-[8px] font-black px-1 rounded bg-indigo-100 text-indigo-800">
                                  {String(p.balloonSize).replace('_inch', '"')}
                                </span>
                              )}
                            </span>
                          ))}
                          {inv.dispatchedProperties.length > 4 && (
                            <span className="text-[10px] font-bold text-muted-foreground px-1.5">
                              +{inv.dispatchedProperties.length - 4} barang lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCrewSheetInvoice(inv);
                          setCrewSheetOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-dashed border-[#4d3085]/30 hover:border-[#f370a8] hover:bg-[#f370a8]/5 transition-all cursor-pointer flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                        title="Klik untuk memilih properti dan stok balon yang wajib dibawa crew"
                      >
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
                          <span>Belum ada properti / balon gudang yang dicatat untuk pesanan ini</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#4d3085] dark:text-[#c4b5fd] underline">
                          + Siapkan Properti & Balon
                        </span>
                      </div>
                    )}

                    {/* Sisa Tagihan Reminder for Today/Tomorrow events */}
                    {(inv.bookingDate === todayStr || inv.bookingDate === tomorrowStr) &&
                      inv.status !== 'paid' &&
                      (inv.remainingAmount ?? (inv.total - (inv.dpPaidAmount || (inv.status === 'dp_paid' ? Math.round(inv.total * 0.3) : 0)))) > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-wrap items-center justify-between gap-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>
                            Pelunasan H-1 belum tuntas: <strong>{formatRupiah(inv.remainingAmount ?? Math.max(0, inv.total - (inv.dpPaidAmount || (inv.status === 'dp_paid' ? Math.round(inv.total * 0.3) : 0))))}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={generatePaymentReminderMessage(inv)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Kirim pesan tagihan sisa pelunasan ke WhatsApp client"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Tagih via WA 💬</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right / Bottom Action Buttons (Streamlined 2 Primary CTAs + Popover Menu) */}
                <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/80 w-full lg:w-auto justify-end flex-wrap">
                  {/* Primary CTA 1: WhatsApp Confirmation */}
                  <a
                    href={generateWhatsAppMessage(inv)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none h-9 px-3 rounded-xl bg-[#4d3085]/10 hover:bg-[#4d3085]/20 text-[#4d3085] dark:text-[#c4b5fd] font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                    title="Kirim konfirmasi jam ke WhatsApp client"
                  >
                    <MessageCircle className="w-4 h-4 text-[#f370a8]" />
                    <span>WA Client</span>
                  </a>

                  {/* Primary CTA 2: Properti & Checklist Kru */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCrewSheetInvoice(inv);
                      setCrewSheetOpen(true);
                    }}
                    className="flex-1 sm:flex-none h-9 px-3 rounded-xl border-[#4d3085]/30 bg-gradient-to-r from-[#4d3085]/5 to-[#f370a8]/10 hover:from-[#4d3085]/15 hover:to-[#f370a8]/20 text-[#4d3085] dark:text-[#c4b5fd] font-bold text-xs flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-2xs"
                    title="Buka Surat Tugas, Checklist Properti & Stok Balon Kru"
                    aria-label={`Buka Surat Tugas dan Checklist Properti Pesanan #${inv.invoiceNumber}`}
                  >
                    <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
                    <span>Checklist Kru</span>
                    {inv.dispatchedProperties && inv.dispatchedProperties.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-[#4d3085] text-white">
                        {inv.dispatchedProperties.length}
                      </span>
                    )}
                  </Button>

                  {/* Lunaskan Tagihan 1-Klik (jika belum lunas) */}
                  {inv.status !== 'paid' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuickMarkPaid(inv)}
                      className="h-9 w-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-105 active:scale-95 transition-all shrink-0"
                      title="Catat Pelunasan Tagihan (Lunas Penuh ✨)"
                      aria-label={`Catat Pelunasan Tagihan #${inv.invoiceNumber}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Secondary Actions Popover Menu (•••) */}
                  <Popover>
                    <PopoverTrigger
                      aria-label={`Menu aksi tambahan untuk invoice #${inv.invoiceNumber}`}
                      className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      title="Aksi Tambahan"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onViewInvoice(inv)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted flex items-center gap-2 text-foreground transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Lihat Rincian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintInvoice(inv)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#f370a8]/10 text-foreground hover:text-[#f370a8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#f370a8]" />
                        <span>Cetak Faktur (A5)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#4d3085]/10 text-foreground hover:text-[#4d3085] dark:hover:text-[#c4b5fd] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
                        <span>Atur Jam & Crew</span>
                      </button>

                      <a
                        href={generateCrewBriefMessage(inv)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#f370a8]/10 text-foreground hover:text-[#f370a8] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-[#f370a8]" />
                        <span>Brief ke WA Crew</span>
                      </a>

                      {inv.status !== 'paid' && (
                        <a
                          href={generatePaymentReminderMessage(inv)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer border-t border-border/60 pt-2"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Tagih Pelunasan WA</span>
                        </a>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== 5B. MONTHLY SCHEDULE TABLE VIEW ==================== */
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="p-3.5 sm:p-4 bg-muted/30 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-[#f370a8]" />
                Tabel Agenda Bulan {MONTH_NAMES_ID[viewMonth]} {viewYear}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Daftar terperinci seluruh jadwal pesanan, jam mulai, loading, lokasi, dan status dekorasi.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd] self-start sm:self-auto">
              Total {filteredList.length} Jadwal
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-36 text-xs font-bold text-foreground uppercase tracking-wider">
                    Tanggal & Hari
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-foreground uppercase tracking-wider">
                    Jam Acara
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-foreground uppercase tracking-wider">
                    Jam Setup Balon
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-foreground uppercase tracking-wider">
                    Client & WA
                  </TableHead>
                  <TableHead className="min-w-48 text-xs font-bold text-foreground uppercase tracking-wider">
                    Lokasi / Venue
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-foreground uppercase tracking-wider">
                    Tema & Paket
                  </TableHead>
                  <TableHead className="w-36 text-xs font-bold text-foreground uppercase tracking-wider">
                    Properti & Balon
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="w-36 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredList.map((inv) => {
                  const dateInfo = getDayInfo(inv.bookingDate);
                  const statusConfig =
                    SCHEDULE_STATUS_CONFIG[inv.scheduleStatus || 'scheduled'] ||
                    SCHEDULE_STATUS_CONFIG.scheduled;

                  return (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        'border-border transition-colors hover:bg-muted/40',
                        dateInfo.isToday && 'bg-[#f370a8]/5 hover:bg-[#f370a8]/10'
                      )}
                    >
                      {/* Tanggal & Hari */}
                      <TableCell className="font-medium">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
                            <span>{dateInfo.dayName}, {dateInfo.dayNum} {dateInfo.monthYear}</span>
                          </div>
                          {dateInfo.isToday && (
                            <span className="inline-block px-1.5 py-0.2 rounded-md bg-[#f370a8] text-white text-[9px] font-black uppercase">
                              Hari Ini
                            </span>
                          )}
                          {dateInfo.isTomorrow && (
                            <span className="inline-block px-1.5 py-0.2 rounded-md bg-[#4d3085] text-white text-[9px] font-bold uppercase">
                              Besok
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Jam Acara */}
                      <TableCell>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-border text-xs font-mono font-bold text-foreground">
                          <Clock className="w-3 h-3 text-[#f370a8]" />
                          <span>
                            {inv.eventTime || '14:00'}
                            {inv.eventEndTime ? ` - ${inv.eventEndTime}` : ''}
                          </span>
                        </div>
                      </TableCell>

                      {/* Jam Setup Balon */}
                      <TableCell>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#4d3085]/10 dark:bg-[#4d3085]/25 border border-[#4d3085]/20 text-xs font-mono font-bold text-[#4d3085] dark:text-[#c4b5fd]">
                          <Sparkles className="w-3 h-3 text-[#f370a8]" />
                          <span>{inv.setupTime || '11:00'}</span>
                        </div>
                      </TableCell>

                      {/* Client & WA */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-foreground">
                            {inv.clientName || '(Tanpa Nama)'}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#f370a8]" />
                            <span>{inv.clientPhone || '—'}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Lokasi / Venue */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-[#f370a8] shrink-0" />
                          <span className="truncate">{inv.venue || inv.clientAddress || '—'}</span>
                        </div>
                      </TableCell>

                      {/* Tema & Paket */}
                      <TableCell>
                        <div className="space-y-0.5 max-w-xs">
                          <div className="text-xs font-semibold text-foreground line-clamp-1">
                            {inv.themeNote || inv.items?.[0]?.description || '—'}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                            <span>{inv.items?.length || 0} Item • {formatRupiah(inv.total)}</span>
                            {inv.status === 'cancelled' ? (
                              <span className="text-rose-500 font-bold">• Batal ✕</span>
                            ) : inv.status === 'paid' ? (
                              <span className="text-emerald-500 font-bold">• Lunas ✨</span>
                            ) : (inv.status === 'dp_paid' || (inv.dpPaidAmount && inv.dpPaidAmount > 0)) ? (
                              <span className="text-rose-500 font-bold">• Sisa: {formatRupiah(inv.remainingAmount ?? Math.max(0, inv.total - (inv.dpPaidAmount || Math.round(inv.total * 0.3))))}</span>
                            ) : null}
                          </div>
                          {inv.assignedCrew && (
                            <div className="text-[10px] text-[#4d3085] dark:text-[#c4b5fd] font-bold flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-[#f370a8]" />
                              <span>Crew: {inv.assignedCrew}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Properti & Balon */}
                      <TableCell>
                        {inv.dispatchedProperties && inv.dispatchedProperties.length > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCrewSheetInvoice(inv);
                              setCrewSheetOpen(true);
                            }}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer hover:scale-105 active:scale-95 shadow-2xs',
                              inv.dispatchedProperties.every((p) => p.checkedIn)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : inv.dispatchedProperties.every((p) => p.checkedOut)
                                ? 'bg-[#4d3085]/10 text-[#4d3085] border-[#4d3085]/30 dark:text-[#c4b5fd]'
                                : 'bg-card border-border hover:border-[#f370a8]/50 text-foreground'
                            )}
                            title="Klik untuk melihat dan mengatur kebutuhan properti & checklist kru pesanan ini"
                            aria-label={`Buka checklist properti dan lembar tugas pesanan #${inv.invoiceNumber}`}
                          >
                            <Boxes className="w-3.5 h-3.5 text-[#f370a8]" />
                            <span>
                              {inv.dispatchedProperties.every((p) => p.checkedIn)
                                ? '✨ Selesai'
                                : inv.dispatchedProperties.every((p) => p.checkedOut)
                                ? '🚀 100% Siap'
                                : `${inv.dispatchedProperties.filter((p) => p.checkedOut).length}/${inv.dispatchedProperties.length} Siap`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCrewSheetInvoice(inv);
                              setCrewSheetOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-[#f370a8] transition-all"
                            title="Klik untuk menambahkan properti gudang ke acara ini"
                          >
                            <Plus className="w-3 h-3 text-[#f370a8]" />
                            <span>+ Properti</span>
                          </button>
                        )}
                      </TableCell>

                      {/* Status - Quick Switcher */}
                      <TableCell>
                        <select
                          value={inv.scheduleStatus || 'scheduled'}
                          onChange={(e) => handleQuickChangeStatus(inv, e.target.value as ScheduleStatus)}
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border outline-none cursor-pointer transition-all',
                            statusConfig.badge
                          )}
                          title="Klik untuk langsung mengubah status acara"
                        >
                          <option value="scheduled" className="bg-card text-foreground">Dijadwalkan</option>
                          <option value="ready" className="bg-card text-foreground">Siap Dekor</option>
                          <option value="in_progress" className="bg-card text-foreground">Pengerjaan</option>
                          <option value="completed" className="bg-card text-foreground">Selesai</option>
                        </select>
                      </TableCell>

                      {/* Aksi */}
                      {/* Aksi (Streamlined: WA, Checklist, Lunaskan + Popover Menu) */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Chat WhatsApp Client */}
                          <a
                            href={generateWhatsAppMessage(inv)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-[#4d3085] dark:text-[#c4b5fd] hover:bg-[#4d3085]/15 transition-all hover:scale-105 active:scale-95"
                            title="Chat WhatsApp Client"
                            aria-label={`Hubungi WhatsApp client ${inv.clientName || ''}`}
                          >
                            <MessageCircle className="w-4 h-4 text-[#f370a8]" />
                          </a>

                          {/* Checklist SPK Kru */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCrewSheetInvoice(inv);
                              setCrewSheetOpen(true);
                            }}
                            className="h-8 w-8 text-[#4d3085] dark:text-[#c4b5fd] hover:bg-[#4d3085]/15 rounded-xl transition-all hover:scale-105 active:scale-95"
                            title="Buka Surat Tugas & Checklist Barang Lapangan"
                            aria-label={`Buka Surat Tugas dan Checklist #${inv.invoiceNumber}`}
                          >
                            <ClipboardCheck className="w-4 h-4 text-[#4d3085] dark:text-[#c4b5fd]" />
                          </Button>

                          {/* Quick Lunaskan 1-Klik */}
                          {inv.status !== 'paid' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickMarkPaid(inv)}
                              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all hover:scale-105 active:scale-95"
                              title="Tandai Sudah Lunas Penuh ✨"
                              aria-label={`Tandai Lunas Invoice #${inv.invoiceNumber}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Popover Aksi Tambahan */}
                          <Popover>
                            <PopoverTrigger
                              aria-label={`Menu aksi tambahan untuk jadwal #${inv.invoiceNumber}`}
                              className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                              title="Aksi Tambahan"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5 text-left">
                              <button
                                type="button"
                                onClick={() => onViewInvoice(inv)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-muted flex items-center gap-2 text-foreground transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Lihat Rincian</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onPrintInvoice(inv)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#f370a8]/10 text-foreground hover:text-[#f370a8] flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#f370a8]" />
                                <span>Cetak Faktur (A5)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inv)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#4d3085]/10 text-foreground hover:text-[#4d3085] dark:hover:text-[#c4b5fd] flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd]" />
                                <span>Atur Jam & Crew</span>
                              </button>

                              <a
                                href={generateCrewBriefMessage(inv)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#f370a8]/10 text-foreground hover:text-[#f370a8] flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-[#f370a8]" />
                                <span>Brief ke WA Crew</span>
                              </a>

                              {inv.status !== 'paid' && (
                                <a
                                  href={generatePaymentReminderMessage(inv)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer border-t border-border/60 pt-2"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Tagih Pelunasan WA</span>
                                </a>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      <ScheduleEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        invoice={selectedSchedule}
        onSave={handleSaveSchedule}
      />

      {/* Printable Crew Dispatch & Packing Checklist Sheet Modal */}
      <CrewDispatchSheetModal
        open={crewSheetOpen}
        onOpenChange={setCrewSheetOpen}
        invoice={crewSheetInvoice}
        inventoryItems={inventoryItems}
        onUpdateInvoice={(updated) => {
          setCrewSheetInvoice(updated);
          onUpdateInvoice(updated);
        }}
      />
    </div>
  );
};
