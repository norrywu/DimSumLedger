# PRD — Aplikasi POS Teras Dimsum (Prototipe)

**Versi:** 0.1
**Tanggal:** 26 Juli 2026
**Status:** Prototipe belajar, bukan untuk produksi
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL)

---

## 1. Tujuan

Membuat web app sederhana untuk **melihat logika POS bekerja secara nyata** — terutama tiga hal yang sudah dirancang di skema database:

1. Produk punya varian (Isi 4 / 6 / 8), dan harga menempel di varian
2. Chili oil sebagai modifier, bukan produk terpisah
3. Harga & HPP **dibekukan** saat transaksi, sehingga laporan lama tidak berubah saat harga naik

Ini prototipe untuk membuktikan rancangannya benar, bukan aplikasi yang langsung dipakai jualan.

---

## 2. Yang TIDAK dibuat (non-goals)

Sengaja dikeluarkan supaya prototipe ini selesai, bukan mangkrak:

| Tidak dibuat                   | Alasan                                    |
| ------------------------------ | ----------------------------------------- |
| Login / autentikasi            | Diminta tanpa auth                        |
| Manajemen stok                 | Butuh data pcs yang akurat dulu           |
| Cetak struk ke printer thermal | Butuh perangkat keras                     |
| Multi-outlet                   | Belum ada kebutuhan                       |
| Mode offline                   | Rumit, tidak menambah pemahaman logika    |
| Resep / BOM per gram           | Bikin input produk jadi 15 menit per item |
| Diskon & promo                 | Tambahan lapisan hitungan, tunda dulu     |

---

## 3. ⚠️ Peringatan keamanan — WAJIB DIBACA

Tanpa auth, aplikasi ini **terbuka untuk siapa saja yang tahu URL-nya**.

Dokumentasi Supabase menyatakan:

> "RLS must always be enabled on any tables stored in an exposed schema."

Terjemahan bebasnya: RLS (Row Level Security) itu penjaga di tingkat baris data. Kalau tabelmu bisa diakses dari internet, penjaga ini **wajib** dinyalakan. <br>
Dan menurut dokumentasi Supabase, publishable/anon key memang bukan rahasia — dia aman diekspos **hanya jika** dipasangkan dengan RLS dan hak akses seminimal mungkin. Kalau RLS mati, siapa pun yang punya URL proyek dan anon key bisa membaca dan mengubah seluruh isi databasemu.

**Konsekuensi untuk prototipe ini:**

- Jangan pernah memasukkan data transaksi asli usaha ke sini
- Jangan pakai untuk jualan sungguhan sebelum auth + RLS dipasang
- Jangan pernah menaruh `service_role key` di kode frontend — kunci itu menembus semua penjaga
- Jangan sebar URL-nya

Analoginya: ini seperti membangun rumah tanpa pintu dulu, supaya kelihatan jelas denahnya. Bagus untuk belajar, tapi jangan ditinggali.

**Kompromi yang disarankan:** tetap nyalakan RLS, lalu buat policy terbuka sementara. Nanti waktu auth ditambahkan, tinggal ganti isi policy-nya — tidak perlu bongkar ulang.

```sql
-- Nyalakan penjaganya (lakukan untuk SEMUA tabel)
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;

-- Sementara: izinkan semua. GANTI ini setelah auth ada.
CREATE POLICY "prototipe_akses_terbuka" ON produk
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## 4. Pengguna

Satu peran saja: **operator** (kasir merangkap admin). Tidak ada pembeda hak akses.

---

## 5. Halaman

### 5.1 `/` — Kasir (halaman utama)

Halaman paling sering dipakai. Layout dua kolom di layar lebar, menumpuk di HP.

**Kiri — daftar menu**

- Produk dikelompokkan per kategori, urut sesuai kolom `urutan`
- Hanya menampilkan produk & varian dengan `aktif = TRUE`
- Tiap varian jadi satu tombol: nama varian + harga
- Klik varian → muncul pilihan modifier (chili oil) → masuk keranjang

**Kanan — keranjang**

- Daftar item: nama produk, varian, modifier, qty, subtotal
- Tombol tambah/kurang qty, tombol hapus item
- Pilihan tipe: dine-in / takeaway
- Pilihan biaya tambahan: kantong plastik (checkbox)
- Pilihan metode bayar: tunai / QRIS / transfer
- Total besar di bawah
- Tombol **Simpan Transaksi**

**Setelah disimpan:** muncul ringkasan struk di layar, keranjang dikosongkan, siap pesanan berikutnya.

### 5.2 `/produk` — Kelola produk

- Daftar produk beserta varian-variannya
- Form tambah/edit produk: nama, kategori, aktif
- Di bawahnya, tabel varian yang bisa ditambah barisnya:

| Nama varian | Jumlah pcs | Harga jual | Modal bahan | Kemasan               | HPP    | Untung |
| ----------- | ---------- | ---------- | ----------- | --------------------- | ------ | ------ |
| Isi 4       | 4          | 20.000     | 9.500       | ☑ Mika kecil ☑ Sendok | 10.450 | 9.550  |

- Kolom **HPP** dan **Untung** berwarna abu-abu dan tidak bisa diklik — itu hasil hitungan, bukan input
- Pengaturan chili oil per varian: `tambahan_harga` (5.000) dan `tambahan_modal`

### 5.3 `/kemasan` — Kelola kemasan

Halaman paling sederhana. Tabel: nama + harga satuan + aktif. Sekali isi, jarang disentuh.

Efeknya besar: ubah harga mika di sini, HPP semua varian yang memakainya ikut berubah otomatis.

### 5.4 `/laporan` — Laporan harian

- Pilih rentang tanggal
- Ringkasan: omzet, total modal, untung kotor, jumlah transaksi, total pcs terjual
- Tabel per hari
- Daftar produk terlaris
- Tabel HPP & untung per varian (dari `v_hpp_varian`) — untuk melihat varian mana yang tipis untungnya

### 5.5 `/transaksi` — Riwayat

- Daftar struk, terbaru di atas
- Klik → detail struk
- Tombol **Batalkan** (mengubah `status` jadi `dibatalkan`) — **tidak ada tombol hapus**

---

## 6. Logika inti

Bagian ini yang paling penting untuk dibuktikan.

### 6.1 Hitungan keranjang

```
subtotal_item   = (harga_satuan + total_tambahan_modifier) × qty
subtotal_biaya  = jumlah semua nominal biaya (kantong plastik dll)
TOTAL BAYAR     = jumlah semua subtotal_item + subtotal_biaya
```

Contoh: 2 porsi Mentai Isi 4 + chili oil, 1 Goreng Keju Lumer, 1 kantong plastik

```
(20.000 + 5.000) × 2  = 50.000
 23.000          × 1  = 23.000
 kantong plastik      =    500
 ─────────────────────────────
 TOTAL                = 73.500
```

### 6.2 Pembekuan data saat simpan (paling krusial)

Saat tombol Simpan ditekan, aplikasi **menyalin** nilai-nilai ini ke tabel transaksi — tidak cukup menyimpan `varian_id` saja:

| Disalin ke `transaksi_item` | Dari mana                                        |
| --------------------------- | ------------------------------------------------ |
| `nama_produk`               | `produk.nama`                                    |
| `nama_varian`               | `varian.nama`                                    |
| `jumlah_pcs`                | `varian.jumlah_pcs`                              |
| `harga_satuan`              | `varian.harga_jual`                              |
| `hpp_satuan`                | `v_hpp_varian.hpp` ← hasil hitungan, bukan kolom |

**Kenapa `hpp_satuan` diambil dari view, bukan dihitung di frontend?** Supaya sumber hitungannya cuma satu. Kalau frontend ikut menghitung HPP sendiri, suatu hari rumusnya bisa berbeda dengan yang di database — dan tidak ada yang sadar sampai laporannya aneh.

### 6.3 Simpan transaksi harus "semua atau tidak sama sekali"

Satu transaksi menulis ke 4 tabel: `transaksi`, `transaksi_item`, `transaksi_item_modifier`, `transaksi_biaya`.

Kalau tabel pertama berhasil lalu koneksi putus di tabel kedua, akan lahir struk kosong tanpa isi — laporan jadi kacau.

**Solusi:** buat satu fungsi database (`RPC`) yang menerima seluruh isi keranjang sekaligus dan menulisnya dalam satu transaksi Postgres. Kalau ada satu saja yang gagal, semuanya batal.

> Analoginya: seperti transfer bank. Uang tidak boleh sudah keluar dari rekeningmu tapi belum masuk ke rekening tujuan. Harus dua-duanya berhasil, atau dua-duanya batal.

### 6.4 Perbaikan `v_laba_harian`

View versi awal belum menghitung modifier dan biaya kantong, jadi angka untungnya lebih kecil dari kenyataan. Harus diperbaiki sebelum halaman laporan dipakai. (Dikerjakan di Tahap 4.)

---

## 7. Struktur folder

```
app/
  layout.tsx
  page.tsx                 ← /       kasir
  produk/page.tsx          ← /produk
  kemasan/page.tsx         ← /kemasan
  laporan/page.tsx         ← /laporan
  transaksi/page.tsx       ← /transaksi
  transaksi/[id]/page.tsx  ← detail struk

components/
  kasir/DaftarMenu.tsx
  kasir/Keranjang.tsx
  kasir/DialogModifier.tsx
  produk/FormVarian.tsx
  ui/                      ← tombol, input, dll

lib/
  supabase/client.ts       ← koneksi untuk Client Component
  supabase/server.ts       ← koneksi untuk Server Component
  hitung.ts                ← SEMUA rumus hitungan, dikumpulkan di sini
  format.ts               ← format rupiah

types/
  database.ts              ← hasil generate dari Supabase CLI
```

**Catatan `lib/hitung.ts`:** semua rumus dikumpulkan di satu file, tidak disebar di komponen. Kalau nanti rumusnya berubah, cuma ada satu tempat yang perlu diedit — dan satu tempat yang perlu diuji.

**Catatan `types/database.ts`:** jangan diketik manual. Supabase CLI bisa membuat tipe TypeScript langsung dari skema database, jadi kalau kolom di database berubah, TypeScript langsung memberi tahu bagian kode mana yang rusak.

---

## 8. Tahapan pengerjaan

Urutannya sengaja begini: yang paling berisiko dikerjakan lebih dulu.

| Tahap | Isi                                                          | Selesai kalau                                                      |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| **1** | Setup Next.js + Supabase, jalankan skema SQL, generate types | `v_hpp_varian` bisa ditampilkan di halaman                         |
| **2** | Halaman `/kemasan` dan `/produk`                             | Bisa input Dimsum Mentai lengkap 3 varian, HPP terhitung otomatis  |
| **3** | Halaman kasir + simpan transaksi (RPC)                       | Bisa buat struk contoh, data masuk ke 4 tabel dengan benar         |
| **4** | Perbaiki `v_laba_harian`, buat `/laporan`                    | Angka untung sesuai hitungan manual                                |
| **5** | `/transaksi` + pembatalan                                    | Transaksi dibatalkan hilang dari laporan tapi masih ada di riwayat |

Tahap 3 yang paling menentukan. Kalau pembekuan data di situ salah, tahap-tahap berikutnya ikut salah dan baru ketahuan setelah datanya banyak.

---

## 9. Kriteria selesai

Prototipe dianggap berhasil kalau **uji pembekuan harga** ini lolos:

1. Buat transaksi: Dimsum Mentai Isi 4, harga 20.000
2. Buka `/produk`, ubah harga Isi 4 jadi 22.000
3. Buka kembali struk tadi di `/transaksi`

**Struk harus tetap menampilkan 20.000.** Kalau berubah jadi 22.000, berarti pembekuannya gagal dan harus diperbaiki sebelum lanjut.

Uji tambahan:

- [ ] Ubah harga mika di `/kemasan` → HPP semua varian yang memakainya ikut berubah
- [ ] Transaksi dibatalkan tidak masuk `/laporan`, tapi masih terlihat di `/transaksi`
- [ ] Total di layar kasir sama persis dengan hitungan manual
- [ ] Produk dinonaktifkan hilang dari kasir, tapi struk lamanya masih terbaca

---

## 10. Data yang masih harus kamu isi sendiri

Semua angka modal di file skema masih tebakan. Sebelum laporannya bisa dipercaya:

- [ ] `modal_bahan` tiap varian — hitung dari sekali produksi: habis berapa, dapat berapa pcs
- [ ] `harga_satuan` tiap kemasan — mika kecil, mika besar, cup sambal, sendok, kantong
- [ ] `tambahan_modal` chili oil per varian — sekali bikin sambal habis berapa, dapat berapa cup
- [ ] `jumlah_pcs` untuk Dimsum Goreng Keju Lumer — belum diketahui, menu tidak menyebutkan
- [ ] `tambahan_harga` chili oil = **5.000 di semua varian**, sesuai menu cetak

Item terakhir sudah pasti. Empat lainnya butuh kamu turun ke dapur sekali.
