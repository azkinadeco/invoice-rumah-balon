# 🎈 Rumah Balon Decoration - Invoice Generator Admin

Aplikasi web modern berbasis **Next.js 16** dan **shadcn/ui** untuk admin membuat, mengelola, mencetak, dan mengekspor invoice resmi **Rumah Balon Decoration** sesuai dengan template asli (`Template Invoice Rumah Balon.pdf`).

---

## ✨ Fitur Unggulan

1. **Pixel-Perfect Matching Template Asli**:
   - Layout 1:1 sesuai template Canva/PDF resmi Rumah Balon.
   - Font kustom yang sama (*Lepetitcochon*, *DO-Sans*, dan *Lazydog*).
   - Aset visual asli: Logo Rumah Balon resolusi tinggi, ilustrasi balon oranye, bouquet balon warna-warni, serta watermark logo di latar belakang.
   - Kolom kanan dengan latar belakang pink khas (`#f370a8`) dan ornamen lengkungan / pil dekoratif.

2. **Form Editor Interaktif & Cepat**:
   - **Nomor Invoice & Tanggal**: Tombol generate nomor invoice acak/berurutan otomatis, tanggal terbit, dan tanggal acara (*Booking Date*).
   - **Data Pelanggan**: Nama client dan nomor WhatsApp.
   - **Daftar Item & Layanan**: Tambah/hapus item tak terbatas, input format Rupiah otomatis (`Rp 1.200.000`), dan **Template Paket Terpopuler** untuk menambahkan paket dekorasi dengan 1 klik.
   - **Kalkulasi Otomatis**: Subtotal, Pajak (*Tax*), Diskon, dan Rekomendasi Minimal DP 30% (*Down Payment*).
   - **Metode Pembayaran**: Rekening Bank BCA a/n DYAS KURNIAWAN, nomor rekening kustom, serta toggle & upload gambar barcode QRIS.
   - **Status Pelacakan**: *Draft*, *Terkirim*, *DP Terbayar (30%)*, *Lunas*, atau *Dibatalkan*.

3. **Multi-Format Export & Sharing**:
   - **Download PDF A4**: Render beresolusi tinggi (300 DPI) siap cetak.
   - **Download Gambar (PNG)**: Memudahkan admin mengirim invoice langsung sebagai gambar via WhatsApp.
   - **Kirim WhatsApp**: 1 klik membuka WhatsApp dengan nomor client dan format pesan otomatis berisi nomor invoice, tanggal acara, total, minimal DP, dan rekening tujuan.
   - **Cetak (Print)**: Pengaturan CSS `@media print` yang presisi pas di kertas A4 tanpa header/footer bawaan browser.

4. **Penyimpanan Lokal & Riwayat Invoice**:
   - Simpan invoice otomatis ke `localStorage`.
   - Dialog pencarian riwayat invoice berdasarkan nama client, nomor invoice, dan filter status pembayaran.
   - Fitur duplikasi invoice (*clone*) untuk mempercepat pembuatan invoice berulang.

---

## 🚀 Cara Menjalankan Aplikasi

Pastikan Node.js (v18 ke atas) telah terinstal di komputer.

```bash
# Masuk ke direktori
cd "/Users/apple/Documents/CODING/Invoice Site"

# Jalankan mode pengembangan (development)
npm run dev
```

Buka browser di: [http://localhost:3000](http://localhost:3000)

Untuk membangun versi produksi:
```bash
npm run build
npm start
```

---

## 🎨 Palet Warna & Tipografi

- **Pink Khas**: `#f370a8`
- **Ungu Judul**: `#4d3085`
- **Krim Latar**: `#fff9f5`
- **Teks Utama**: `#2a2e30`
- **Pajak & Catatan DP**: `#e11d48`
- **Font Judul**: `Lepetitcochon`
- **Font Teks**: `DO-Sans` & `Inter`
