'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { InvoiceData, ScheduleStatus } from '@/types/invoice';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  Save,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
  onSave: (updatedData: {
    bookingDate: string;
    eventTime?: string;
    eventEndTime?: string;
    setupTime?: string;
    venue?: string;
    themeNote?: string;
    crewNote?: string;
    assignedCrew?: string;
    scheduleStatus?: ScheduleStatus;
  }) => void;
}

const TIME_PRESETS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '18:30', '19:00'];

export const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  open,
  onOpenChange,
  invoice,
  onSave,
}) => {
  const [bookingDate, setBookingDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [setupTime, setSetupTime] = useState('');
  const [venue, setVenue] = useState('');
  const [themeNote, setThemeNote] = useState('');
  const [crewNote, setCrewNote] = useState('');
  const [assignedCrew, setAssignedCrew] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>('scheduled');

  useEffect(() => {
    if (invoice && open) {
      setBookingDate(invoice.bookingDate || '');
      setEventTime(invoice.eventTime || '14:00');
      setEventEndTime(invoice.eventEndTime || '17:00');
      setSetupTime(invoice.setupTime || '11:00');
      setVenue(invoice.venue || invoice.clientAddress || '');
      setThemeNote(invoice.themeNote || (invoice.items?.[0]?.description ? invoice.items[0].description.slice(0, 50) + '...' : ''));
      setCrewNote(invoice.crewNote || '');
      setAssignedCrew(invoice.assignedCrew || '');
      setScheduleStatus(invoice.scheduleStatus || 'scheduled');
    }
  }, [invoice, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      bookingDate,
      eventTime,
      eventEndTime,
      setupTime,
      venue,
      themeNote,
      crewNote,
      assignedCrew,
      scheduleStatus,
    });
    onOpenChange(false);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border bg-gradient-to-r from-card via-[#f370a8]/5 to-card">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f370a8] to-[#4d3085] flex items-center justify-center text-white shadow-md shadow-[#f370a8]/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                  Atur Jam & Jadwal Pesanan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Client: <span className="font-bold text-foreground">{invoice.clientName}</span> ({invoice.invoiceNumber})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Status Pelaksanaan Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#f370a8]" />
              Status Pengerjaan Acara
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'scheduled', label: 'Dijadwalkan', desc: 'Menunggu waktu', color: 'border-[#4d3085]/40 text-[#4d3085] dark:text-[#c4b5fd]' },
                { key: 'ready', label: 'Siap Dekor', desc: 'Balon siap rakit', color: 'border-[#f370a8]/50 text-[#be185d] dark:text-[#f472b6]' },
                { key: 'in_progress', label: 'Pengerjaan', desc: 'Sedang loading/pasang', color: 'border-[#f370a8] text-[#f370a8]' },
                { key: 'completed', label: 'Selesai', desc: 'Acara sukses', color: 'border-[#4d3085] text-[#4d3085]' },
              ].map((st) => {
                const isActive = scheduleStatus === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setScheduleStatus(st.key as ScheduleStatus)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                      isActive
                        ? 'border-2 border-[#f370a8] bg-[#f370a8]/10 shadow-xs'
                        : 'border-border/80 bg-muted/40 hover:bg-muted/70'
                    )}
                  >
                    <div className="font-bold text-xs text-foreground flex items-center justify-between">
                      {st.label}
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#f370a8]" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{st.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Tanggal & Waktu Jam */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#4d3085] dark:text-[#f370a8]" />
              Tanggal & Pengaturan Jam
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Tanggal Acara / Booking
                </Label>
                <div className="mt-1">
                  <DatePicker
                    value={bookingDate}
                    onChange={setBookingDate}
                    highlight
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Jam Mulai Setup / Loading Balon</span>
                  <span className="text-[10px] text-[#f370a8] font-bold">Rekomendasi 2-3 jam sebelum</span>
                </Label>
                <Input
                  type="time"
                  value={setupTime}
                  onChange={(e) => setSetupTime(e.target.value)}
                  className="mt-1 h-10 rounded-xl bg-card border-border font-mono font-semibold"
                />
              </div>
            </div>

            {/* Jam Acara Mulai & Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Jam Mulai Acara
                </Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="mt-1 h-10 rounded-xl bg-card border-border font-mono font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Jam Selesai / Waktu Bongkar
                </Label>
                <Input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="mt-1 h-10 rounded-xl bg-card border-border font-mono font-semibold"
                />
              </div>
            </div>

            {/* Quick Presets for Event Time */}
            <div>
              <div className="text-[11px] text-muted-foreground font-semibold mb-1.5">
                Preset Cepat Jam Acara:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEventTime(t);
                      // Auto calculate setup 2.5 hours prior
                      const [h, m] = t.split(':').map(Number);
                      const setupH = Math.max(7, h - 3);
                      setSetupTime(`${String(setupH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                    }}
                    className={cn(
                      'h-7 px-2.5 text-[11px] rounded-lg font-mono font-semibold border-border',
                      eventTime === t
                        ? 'bg-[#f370a8] text-white border-[#f370a8]'
                        : 'bg-card hover:bg-muted text-foreground'
                    )}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Lokasi / Venue Acara */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#f370a8]" />
              Lokasi / Venue Pemasangan Dekorasi
            </Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Contoh: Hotel Aria Gajayana Ballroom Lt. 3 / Rumah Client Jl. Ijen No. 10"
              className="h-10 rounded-xl bg-card border-border"
            />
          </div>

          {/* Section 3: Tema Balon & Request Client */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <PartyPopper className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              Tema Balon / Konsep Dekorasi
            </Label>
            <Input
              value={themeNote}
              onChange={(e) => setThemeNote(e.target.value)}
              placeholder="Contoh: Tema Cinnamoroll Pastel Pink & Biru, Backdrop Bulat 2m"
              className="h-10 rounded-xl bg-card border-border"
            />
          </div>

          {/* Section 4: Penugasan Crew & Catatan Lapangan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              Nama Petugas / Crew yang Ditugaskan
            </Label>
            <Input
              value={assignedCrew}
              onChange={(e) => setAssignedCrew(e.target.value)}
              placeholder="Contoh: Tim A (Andi & Rian) / Mas Dimas & Bayu"
              className="h-10 rounded-xl bg-card border-border text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#f370a8]" />
              Instruksi / Catatan Khusus untuk Crew Lapangan
            </Label>
            <textarea
              value={crewNote}
              onChange={(e) => setCrewNote(e.target.value)}
              placeholder="Contoh: Bawa tangga lipat 3m, kontak PIC venue Pak Anton (0812-xxx), parkir loading lewat basement barat."
              rows={3}
              className="w-full p-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs outline-none focus:ring-2 focus:ring-[#f370a8]/20 transition-all resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl border-border"
            >
              Batal
            </Button>

            <Button
              type="submit"
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#f370a8] to-[#4d3085] hover:opacity-95 text-white font-bold shadow-md shadow-[#f370a8]/25 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan Jadwal & Jam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
