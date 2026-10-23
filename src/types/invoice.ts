import { DispatchedProperty } from './inventory';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'dp_paid' | 'paid' | 'cancelled';

export type ScheduleStatus = 'scheduled' | 'ready' | 'in_progress' | 'completed';

export interface BusinessSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  qrisImageUrl: string;
  showQris: boolean;
  minDpNote: string;
  notes: string[];
  contactIg: string;
  contactWa: string;
}

export interface InvoiceData extends BusinessSettings {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  bookingDate: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  dpMinPercent: number;
  dpAmount: number;
  dpPaidAmount?: number;      // Nominal DP custom yang sudah dibayarkan oleh client
  remainingAmount?: number;   // Sisa tagihan belum dibayar = total - (dpPaidAmount || 0)
  total: number;
  status: InvoiceStatus;
  
  // Field Jadwal & Acara
  eventTime?: string;      // Jam Mulai Acara (misal "14:00")
  eventEndTime?: string;   // Jam Selesai Acara (misal "17:00")
  setupTime?: string;      // Jam Setup / Loading Balon (misal "11:00")
  venue?: string;          // Lokasi / Venue Acara
  themeNote?: string;      // Tema Balon / Request Khusus
  crewNote?: string;       // Catatan Khusus Crew Lapangan
  assignedCrew?: string;   // Nama Crew / Petugas Lapangan yang Ditugaskan (misal "Andi & Rian")
  scheduleStatus?: ScheduleStatus;
  dispatchedProperties?: DispatchedProperty[]; // Checklist properti/alat gudang yang dibawa crew

  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clientName: string;
  clientPhone: string;
  bookingDate: string;      // YYYY-MM-DD
  eventTime?: string;       // HH:mm
  eventEndTime?: string;    // HH:mm
  setupTime?: string;       // HH:mm
  venue?: string;
  themeNote?: string;
  crewNote?: string;
  assignedCrew?: string;
  itemsSummary?: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PresetItem {
  name: string;
  description: string;
  amount: number;
}
