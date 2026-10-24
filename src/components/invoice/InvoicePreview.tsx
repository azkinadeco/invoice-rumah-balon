'use client';

import React from 'react';
import Image from 'next/image';
import { InvoiceData } from '@/types/invoice';
import { formatRupiah, formatDateIndo } from '@/lib/format';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  data: InvoiceData;
  scale?: number;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, scale = 1 }) => {
  // Compute DP paid & remaining balance
  const isPaid = data.status === 'paid';
  const isDpStatus = data.status === 'dp_paid';
  const customDp = typeof data.dpPaidAmount === 'number' && data.dpPaidAmount > 0 ? data.dpPaidAmount : undefined;

  const dpPaid = isPaid
    ? data.total
    : customDp !== undefined
    ? customDp
    : isDpStatus
    ? (data.dpAmount || Math.round(data.total * 0.3))
    : 0;

  const hasDpPaid = dpPaid > 0;
  const remainingAmount = Math.max(0, data.total - dpPaid);

  // Dynamic typography & spacing scaling for exact A5 paper fit (Prevents item collision with Total bar)
  const itemCount = data.items.length;
  
  // Dynamic scale tiers:
  // Tier 1: 1-4 items (Spacious)
  // Tier 2: 5-6 items (Compact)
  // Tier 3: 7-8 items (Super Compact)
  // Tier 4: 9+ items (Ultra Compact & Condensed)
  const isTierCompact = itemCount >= 5 && itemCount <= 6;
  const isTierSuperCompact = itemCount >= 7 && itemCount <= 8;
  const isTierUltra = itemCount >= 9;

  const itemFontSize = isTierUltra
    ? 'text-[7.2px]'
    : isTierSuperCompact
    ? 'text-[7.8px]'
    : isTierCompact
    ? 'text-[8.5px]'
    : 'text-[9.5px]';

  const itemPaddingY = isTierUltra
    ? 'py-0.2'
    : isTierSuperCompact
    ? 'py-0.5'
    : isTierCompact
    ? 'py-0.8'
    : 'py-1.5';

  const itemLineHeight = isTierUltra
    ? 'leading-[1.15]'
    : isTierSuperCompact || isTierCompact
    ? 'leading-tight'
    : 'leading-snug';

  const itemQtySize = isTierUltra
    ? 'text-[6.8px]'
    : isTierSuperCompact
    ? 'text-[7.2px]'
    : isTierCompact
    ? 'text-[7.8px]'
    : 'text-[8.5px]';

  const headerSpacing = isTierUltra
    ? 'pt-0.5 space-y-0'
    : isTierSuperCompact
    ? 'pt-1 space-y-0.5'
    : 'pt-2 space-y-0.5';

  const balloonHeight = isTierUltra ? 'h-12' : isTierSuperCompact ? 'h-14' : 'h-18';

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
      className="transition-transform duration-200"
    >
      {/* A5 Exact Proportion Paper: 560px x 794px (148mm x 210mm) */}
      <div
        id="invoice-preview-capture"
        className="print-area relative w-[560px] h-[794px] bg-[#fff9f5] text-[#2a2e30] overflow-hidden select-none mx-auto"
        style={{
          fontFamily: "'DOSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          width: '560px',
          height: '794px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.22)',
        }}
      >
        {/* ==================== RIGHT PINK COLUMN BACKGROUND ==================== */}
        <div className="absolute top-0 right-0 w-[204px] h-full bg-[#f370a8] pointer-events-none select-none z-10" />

        {/* Faint Background Watermark on Left Section (Proportional & Centered) */}
        <div className="absolute top-[215px] left-[38px] w-[280px] opacity-[0.045] pointer-events-none select-none z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Watermark"
            style={{
              width: '280px',
              height: 'auto',
              display: 'block',
              maxWidth: '100%',
            }}
          />
        </div>

        {/* ==================== LEFT SECTION CONTENT (width 356px) ==================== */}
        {/* Height clamped exactly to 594px to prevent collision with TOTAL bar at 596px */}
        <div className="absolute top-0 left-0 w-[356px] h-[594px] pl-7 pr-3.5 z-10 flex flex-col justify-between pb-1 overflow-hidden">
          {/* 1. Header (invoice cursive + meta) */}
          <div className={headerSpacing}>
            <h1
              className={cn(
                "leading-none text-[#4d3085] tracking-wide",
                isTierUltra ? "text-[38px]" : isTierSuperCompact ? "text-[42px]" : "text-[48px]"
              )}
              style={{
                fontFamily: "'Lepetitcochon', 'Comic Sans MS', cursive",
              }}
            >
              invoice
            </h1>

            {/* Meta details with orange balloon illustration */}
            <div className={cn("flex items-start gap-2.5", isTierUltra ? "mt-1" : isTierSuperCompact ? "mt-1.5" : "mt-2.5")}>
              <div className={cn("relative w-8 shrink-0", balloonHeight, isTierUltra ? "mt-0.5" : "mt-2.5")}>
                <Image
                  src="/images/balloon_single.png"
                  alt="Balloon"
                  fill
                  sizes="32px"
                  className="object-contain object-top"
                  priority
                />
              </div>

              <div className={cn("space-y-0.5 font-medium text-[#2a2e30] flex-1", isTierUltra ? "text-[8.5px] leading-[1.35]" : "text-[9.5px] leading-[1.45]")}>
                <div className="flex items-center">
                  <span className="w-[72px] font-medium shrink-0">No</span>
                  <span>: {data.invoiceNumber || '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[72px] font-medium shrink-0">Date</span>
                  <span>: {data.invoiceDate ? formatDateIndo(data.invoiceDate) : '—'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[72px] font-medium shrink-0">Booking Date</span>
                  <span className="whitespace-nowrap">: {data.bookingDate ? formatDateIndo(data.bookingDate) : '—'}{data.eventTime ? ` • ${data.eventTime} WIB` : ''}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[72px] font-medium shrink-0">Name</span>
                  <span>: {data.clientName || '—'}</span>
                </div>
                {(data.venue || data.clientAddress) && (
                  <div className="flex items-start">
                    <span className="w-[72px] font-medium shrink-0">Venue</span>
                    <span className="break-words leading-tight flex-1">: {data.venue || data.clientAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Middle Section: Items Table + Subtotal + Tax (Pinned cleanly above TOTAL bar) */}
          <div className="flex-1 flex flex-col justify-between min-h-0 pt-2 pb-0.5">
            {/* Table */}
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center text-[9px] font-bold text-[#2a2e30] pb-1 border-b-2 border-[#2a2e30] tracking-wider uppercase">
                <div className="w-6 text-left font-bold">NO</div>
                <div className="flex-1 px-1.5 text-left font-bold">DESCRIPTION</div>
                <div className="w-20 text-right font-bold">SUBTOTAL</div>
              </div>

              {/* Items List (Auto-condensed to fit up to 12 items without overflowing) */}
              <div className="divide-y divide-transparent pt-0.5 max-h-[220px] overflow-hidden">
                {data.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={cn("flex items-start text-[#1f2224]", itemPaddingY, itemFontSize, itemLineHeight)}
                  >
                    <div className="w-6 text-left font-medium text-[#2a2e30] pt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 px-1.5 whitespace-pre-line font-normal text-[#1a1c1e]">
                      <span>{item.description || '(Belum ada deskripsi)'}</span>
                      {item.quantity && item.quantity > 1 ? (
                        <span className={cn("text-zinc-500 font-medium block mt-0.5", itemQtySize)}>
                          ({item.quantity} pcs @ {formatRupiah(item.unitPrice || Math.round(item.amount / item.quantity))})
                        </span>
                      ) : null}
                    </div>
                    <div className="w-20 text-right font-medium whitespace-nowrap text-[#1a1c1e] pt-0.5">
                      {formatRupiah(item.amount)}
                    </div>
                  </div>
                ))}

                {data.items.length === 0 && (
                  <div className="py-4 text-center text-zinc-400 italic text-[9.5px]">
                    Belum ada item pesanan ditambahkan
                  </div>
                )}
              </div>
            </div>

            {/* Subtotal & Tax Area */}
            <div className="relative pt-1 border-t" style={{ borderColor: 'rgba(77, 48, 133, 0.25)' }}>
              {/* Stempel LUNAS di atas Sub Total */}
              {isPaid && (
                <div
                  className="absolute -top-7 left-2 pointer-events-none select-none z-10"
                  style={{ opacity: 0.5 }}
                >
                  <div
                    className="border-[2px] border-red-600 rounded-md px-3 py-0.5 flex items-center justify-center"
                    style={{ transform: 'rotate(-7deg)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    <span className="text-[14px] font-black tracking-widest uppercase text-red-600 font-mono">
                      LUNAS
                    </span>
                  </div>
                </div>
              )}

              {/* Stempel DP SUDAH DITERIMA di atas Sub Total */}
              {hasDpPaid && !isPaid && (
                <div
                  className="absolute -top-7 left-2 pointer-events-none select-none z-10"
                  style={{ opacity: 0.5 }}
                >
                  <div
                    className="border-[1.5px] border-red-600 rounded-md px-2.5 py-0.5 flex items-center justify-center"
                    style={{ transform: 'rotate(-6deg)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    <span className="text-[10.5px] font-black tracking-wider uppercase text-red-600 font-mono">
                      DP SUDAH DITERIMA
                    </span>
                  </div>
                </div>
              )}

              {/* Min DP notice line */}
              <div className="flex items-center justify-between pb-0.5">
                <span className="text-[8px] font-medium text-[#e11d48] tracking-tight">
                  {data.minDpNote || '( Min Dp 30% of price ,atau sesuai dengan kesepakatan )'}
                </span>
              </div>

              {/* Subtotal, Tax, and DP Row */}
              <div className="space-y-0.5 text-[9.5px]">
                <div className="flex items-center justify-between font-semibold">
                  <span className="tracking-wide text-[#2a2e30]">SUB TOTAL</span>
                  <span className="text-[#2a2e30] font-medium">
                    {formatRupiah(data.subtotal)}
                  </span>
                </div>
                {data.tax > 0 && (
                  <div className="flex items-center justify-between font-semibold text-[#e11d48]">
                    <span className="tracking-wide">TAX</span>
                    <span className="font-medium">
                      {formatRupiah(data.tax)}
                    </span>
                  </div>
                )}
                {/* Rincian DP */}
                {hasDpPaid && (
                  <div
                    className="flex items-center justify-between font-bold text-[#4d3085] pt-0.5 border-t border-dashed"
                    style={{ borderColor: 'rgba(77, 48, 133, 0.25)' }}
                  >
                    <span className="tracking-wide text-[8.5px] uppercase flex items-center gap-1">
                      {isPaid ? 'SUDAH DIBAYAR (LUNAS)' : 'DP (UANG MUKA MASUK)'}
                    </span>
                    <span className="font-bold text-[9.5px]">
                      - {formatRupiah(dpPaid)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== TOTAL PINK BAR ==================== */}
        {/* Fixed at top: 596px, height: 34px, spanning from x: 28px to x: 560px */}
        <div className="absolute top-[596px] left-[28px] right-0 h-[34px] bg-[#f370a8] rounded-l-md flex items-center z-15 select-none shadow-xs">
          <div className="w-[314px] flex items-center justify-between px-2 text-white font-bold">
            {hasDpPaid ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] tracking-wider uppercase font-extrabold">
                    {isPaid || remainingAmount === 0 ? 'STATUS: LUNAS' : 'SISA TAGIHAN'}
                  </span>
                  {!isPaid && remainingAmount > 0 && (
                    <span
                      className="text-[8px] font-semibold px-1 py-0.2 rounded-xs"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      (Pelunasan H-1)
                    </span>
                  )}
                </div>
                <span className="text-[13.5px] font-extrabold tracking-tight">
                  {isPaid || remainingAmount === 0 ? 'LUNAS ✨' : formatRupiah(remainingAmount)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[13.5px] tracking-wider uppercase font-extrabold">
                  TOTAL
                </span>
                <span className="text-[13.5px] font-extrabold tracking-tight">
                  {formatRupiah(data.total)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ==================== BOTTOM SECTION (Notes & Thank You) ==================== */}
        <div className="absolute top-[636px] left-0 w-[356px] pl-7 pr-3.5 z-10">
          {/* Notes */}
          <div className="text-[8px] leading-[1.35] text-[#4d3085] font-medium space-y-0.5 max-w-[300px]">
            <div className="font-bold text-[8.5px]">Note:</div>
            {data.notes.map((note, nIdx) => (
              <div key={nIdx} className="whitespace-normal">
                {note}
              </div>
            ))}
          </div>

          {/* Thank you + Balloon bunch footer */}
          <div className="mt-2 flex items-end justify-between max-w-[314px]">
            <div>
              <div
                className="text-[30px] leading-none text-[#4d3085]"
                style={{
                  fontFamily: "'Lepetitcochon', 'Comic Sans MS', cursive",
                }}
              >
                Thank YoÜ!
              </div>
              <div className="text-[13px] text-[#2a2e30] font-semibold tracking-tight mt-0.5">
                for trusting us :)
              </div>
            </div>

            {/* Colorful Balloon Bunch Graphic */}
            <div className="relative w-16 h-20 shrink-0">
              <Image
                src="/images/balloon_bunch.png"
                alt="Balloons"
                fill
                sizes="64px"
                className="object-contain object-bottom"
                priority
              />
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN CONTENT ==================== */}
        <div className="absolute top-0 right-0 w-[204px] h-full text-white z-20 pointer-events-none select-none text-center flex flex-col justify-between py-6 px-3">
          {/* Top Logo */}
          <div className="flex justify-center pt-1">
            <div className="relative w-[148px] h-[54px]">
              <Image
                src="/images/logo.png"
                alt="Rumah Balon"
                fill
                sizes="148px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Middle Details on Pink Sidebar */}
          <div className="my-auto space-y-3.5 py-2">
            {/* Invoice to */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                Invoice to
              </div>
              <div className="text-[10.5px] font-medium text-white">
                {data.clientName ? `(${data.clientName})` : '(Name client)'}
              </div>
              <div className="text-[9.5px] font-normal text-white">
                {data.clientPhone ? `(${data.clientPhone})` : '(No telefon)'}
              </div>
              {(data.venue || data.clientAddress) && (
                <div className="text-[8.5px] font-medium text-white leading-snug pt-1 px-1.5 break-words max-w-[176px] mx-auto">
                  📍 {data.venue || data.clientAddress}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-white tracking-wider">
                Payment Method
              </div>
              <div className="text-[10px] font-semibold text-white">
                {data.bankName || 'BCA'} {data.bankAccountNumber || '0123456789'}
              </div>
              <div className="text-[9.5px] font-normal text-white">
                a/n {data.bankAccountName || 'Rumah Balon'}
              </div>

              {/* QRIS Barcode (if uploaded and enabled) */}
              {data.showQris && data.qrisImageUrl && (
                <div className="pt-1.5 flex flex-col items-center">
                  <div className="bg-white p-1 rounded-lg shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.qrisImageUrl}
                      alt="QRIS Barcode"
                      className="w-14 h-14 object-contain rounded"
                    />
                  </div>
                  <span className="text-[7.5px] font-black text-white/90 uppercase tracking-widest mt-0.5">
                    Scan QRIS BCA / All E-Wallet
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Social Media & Contact */}
          <div className="space-y-1 pb-1">
            <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-medium text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>
                {data.contactIg
                  ? (data.contactIg.startsWith('@') ? data.contactIg : `@${data.contactIg}`)
                  : '@rumahbalon_mlg'}
              </span>
            </div>
            <div className="text-[9.5px] font-medium text-white">
              {data.contactWa || '+62 857-8612-1897'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
