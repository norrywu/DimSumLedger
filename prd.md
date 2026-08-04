# PRD — Aplikasi POS Teras Dimsum

**Versi:** 1.0
**Tanggal:** 4 Agustus 2026
**Status:** Berjalan, sudah berautentikasi. Belum dipakai jualan sungguhan.
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (PostgreSQL 17)

> Versi 0.1 menggambarkan prototipe tanpa auth dengan rute `/produk`, `/laporan`,
> dan fitur dine-in/takeaway serta biaya kantong plastik. Semua itu sudah tidak
> berlaku. Dokumen ini menggambarkan aplikasi sebagaimana adanya sekarang.

---

## 1. Tujuan

Aplikasi kasir untuk usaha dimsum satu outlet, dengan tiga hal yang jadi
alasan utama dibangun sendiri alih-alih memakai POS jadi:

1. **Harga menempel di varian**, bukan produk — "isi 4" dan "isi 8" punya harga
   dan modal sendiri
2. **Modal terpecah empat**: bahan, kemasan, upah per potong, dan extra —
   sehingga laba yang dilaporkan bukan tebakan
3. **Harga & modal dibekukan saat transaksi**, sehingga laporan lama tidak
   berubah saat harga naik

---

## 2. Peran

| Peran     | Akses                                                            |
| --------- | ---------------------------------------------------------------- |
| `owner`   | Semua                                                            |
| `admin`   | Semua (setara owner; pembedaannya disiapkan untuk kebutuhan nanti) |
| `cashier` | Hanya layar kasir dan riwayat transaksinya sendiri                |

Peran disimpan di `profiles.role`, lalu disalin trigger
`internal.sync_profile_to_auth` ke `app_metadata` di JWT. **Keputusan hak akses
selalu membaca `app_metadata`, tidak pernah `user_metadata`** — yang kedua bisa
diubah pengguna sendiri lewat `supabase.auth.updateUser()`.

---

## 3. Keamanan

Berbeda dari versi 0.1 yang sengaja tanpa auth, aplikasi ini sekarang berlapis:

| Lapis                | Wujud                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Batas sebenarnya** | RLS di setiap tabel; `internal.is_pengelola()` membaca klaim JWT |
| Rute                 | `src/proxy.ts` memantulkan non-pengelola dari `/APP/admin`      |
| Halaman              | `requireManager()` di `APP/admin/layout.tsx` untuk muat langsung |
| Server Action        | `getManager()` wajib pada apa pun yang memakai admin client      |

Guard rute adalah **lapisan pengalaman, bukan keamanan**. Seandainya halaman
admin lolos dirender untuk kasir, setiap query di dalamnya tetap kosong atau
ditolak database.

Penjagaan tambahan yang melekat di data, bukan di UI:

- Harga tidak pernah dikirim dari client. `simpan_transaksi` menghitung total
  dari `variants.harga_jual`; keranjang yang dirusak lewat POST paling banter
  bisa mengubah varian dan jumlah
- `simpan_transaksi` `SECURITY DEFINER` karena kasir tidak boleh membaca tabel
  master; identitasnya diambil dari `auth.uid()`, bukan dari argumen
- `batalkan_transaksi` `SECURITY INVOKER` — RLS yang memutuskan, fungsi tidak
  menambah wewenang

---

## 4. Halaman

### Kasir

| Rute                       | Isi                                                          |
| -------------------------- | ------------------------------------------------------------ |
| `/APP/cashier/order`        | Grid menu, keranjang, uang diterima + kembalian, simpan      |
| `/APP/cashier/transactions` | Riwayat notanya sendiri, detail, batalkan, cetak nota        |

Setelah simpan, keranjang dikosongkan dan panel nota terbuka dengan tombol
cetak. Notanya **diambil ulang dari database**, bukan dirakit dari keranjang di
memori — struk harus berasal dari baris yang benar-benar tersimpan.

### Pengelola

| Rute                        | Isi                                                              |
| --------------------------- | ---------------------------------------------------------------- |
| `/APP/admin/dashboard`      | Ringkasan hari ini & 30 hari, terlaris, selisih kas               |
| `/APP/admin/products`       | Produk + tarif upah per pcs                                       |
| `/APP/admin/variants`       | Varian, kemasan, pratinjau HPP langsung                           |
| `/APP/admin/categories`     | Kategori                                                          |
| `/APP/admin/packagings`     | Kemasan dan harga satuannya                                       |
| `/APP/admin/extra`          | Modifier (chili oil, saus keju)                                   |
| `/APP/admin/transactions`   | Riwayat seluruh kasir                                             |
| `/APP/admin/reports`        | Laporan penjualan per varian, modal terpecah                      |
| `/APP/admin/cashflow`       | Arus kas manual + tombol setor omzet POS                          |
| `/APP/admin/users`          | Kelola pengguna dan perannya                                      |

---

## 5. Logika inti

### 5.1 Hitungan keranjang

```
subtotal_item = (harga_jual + Σ tambahan_harga_extra) × qty
TOTAL         = Σ subtotal_item
kembalian     = dibayar − TOTAL      ← dihitung, tidak disimpan
```

Extra berlaku untuk **seluruh baris**, dijamin `unique (transaksi_item_id,
modifier_id)`. Karena itu `transaksi_item_modifier` tidak punya kolom qty —
qty-nya ada di induknya.

> **Jebakan pelaporan:** `sum(tambahan_harga)` langsung ke
> `transaksi_item_modifier` selalu kurang hitung. Wajib join ke `transaksi_item`
> lalu dikali `qty`. `v_penjualan_item` sudah menutup ini; jangan query mentah.

### 5.2 Pembekuan saat simpan

| Kolom `transaksi_item` | Sumber                        |
| ---------------------- | ----------------------------- |
| `nama_produk`          | `products.nama`               |
| `nama_varian`          | `variants.nama`               |
| `jumlah_pcs`           | `variants.jumlah_pcs`         |
| `harga_satuan`         | `variants.harga_jual`         |
| `modal_bahan_satuan`   | `v_hpp_varian.modal_bahan`    |
| `modal_kemasan_satuan` | `v_hpp_varian.modal_kemasan`  |
| `modal_upah_satuan`    | `v_hpp_varian.modal_upah`     |
| `hpp_satuan`           | **generated** = jumlah ketiga modal di atas |

`hpp_satuan` kolom `GENERATED ALWAYS … STORED`, jadi mustahil melenceng dari
komponennya. Modal diambil dari `v_hpp_varian`, bukan dihitung ulang di
frontend — supaya sumber rumusnya cuma satu.

### 5.3 Upah per potong

Tarif ada di **produk** (`upah_per_pcs`), dikalikan `jumlah_pcs` milik varian.
"Isi 8" otomatis dua kali "isi 4" tanpa diisi ulang. Varian tanpa `jumlah_pcs`
mendapat upah nol, bukan null.

### 5.4 Pembatalan

`status` + `dibatalkan_at` dijaga berpasangan oleh constraint. Kasir boleh
membatalkan notanya sendiri **dalam 10 menit**; lewat itu wewenang pengelola.
Jendela pendek itu mencegah nota lama dibatalkan diam-diam saat toko sepi lalu
tunainya diambil — omzet ikut turun sehingga selisih laci tidak ketahuan.

### 5.5 Setoran omzet ke arus kas

`setor_omzet_harian(tanggal)` menghitung omzet hari itu dari `transaksi`, lalu
menulis satu baris `cash_flow` bersumber `pos`.

- Angkanya dihitung database, tombol hanya mengirim tanggal
- Unique index partial menjamin **satu setoran per tanggal**
- Tekan ulang **menyegarkan**, bukan menggandakan — koreksi kalau ada penjualan
  menyusul atau transaksi dibatalkan
- Batas hari memakai **WIB eksplisit**; TimeZone database UTC, dan tanpa
  konversi, penjualan pukul 06:00 WIB jatuh ke tanggal kemarin

---

## 6. Peta berkas

```
supabase/schemas/        skema deklaratif, dijalankan berurutan
  000_profile  001_helpers  01_categories  02_packagings  03_products
  04_variants  05_variant_packagings  06_modifiers  07_simpan_varian
  08_daftar_pengguna  09_katalog_jual  10_v_hpp_varian  12_katalog_extra
  13_transaksi  14_simpan_transaksi  15_v_penjualan_item
  16_batalkan_transaksi  17_laporan_penjualan  18_cash_flow  19_setor_omzet

src/
  proxy.ts               middleware Next 16 — sesi + guard /APP/admin
  clients/               query BACA dari browser
  servers/               Server Action TULIS
  hooks/                 pembungkus react-query
  lib/count.ts           SEMUA rumus hitungan
  lib/auth-guard.ts      getManager() dan requireManager()
  components/transaksi/  riwayat & nota, dipakai kasir dan pengelola
```

Pembagian `clients/` (baca) dan `servers/` (tulis) berlaku di seluruh fitur.

---

## 7. Yang tidak dibuat

| Tidak dibuat        | Alasan                                        |
| ------------------- | --------------------------------------------- |
| Manajemen stok      | Butuh data pcs yang akurat dulu               |
| Multi-outlet        | Belum ada kebutuhan                           |
| Mode offline        | Rumit, belum sepadan                          |
| Resep/BOM per gram  | Input produk jadi belasan menit per item      |
| Diskon & promo      | Lapisan hitungan tambahan, ditunda            |
| Metode bayar non-tunai | Belum dibutuhkan; hanya `dibayar` tunai    |
| Cetak thermal ESC/POS | Cetak lewat dialog browser sudah cukup      |

---

## 8. Kriteria selesai

**Uji pembekuan harga** — masih kriteria utama:

1. Buat transaksi Dimsum Mentai isi 4 seharga 20.000
2. Ubah harga varian itu jadi 22.000
3. Buka nota tadi di riwayat → **harus tetap 20.000**

Uji lain:

- [ ] Ubah harga mika → HPP semua varian pemakainya ikut berubah
- [ ] Transaksi dibatalkan hilang dari laporan, tetap ada di riwayat
- [ ] Kasir tidak bisa membuka `/APP/admin/*` lewat URL langsung
- [ ] Kasir hanya melihat notanya sendiri di riwayat
- [ ] Setor omzet dua kali tetap menghasilkan satu baris
- [ ] Extra dengan margin ≠ 0 terpisah benar antara omzet dan modalnya

---

## 9. Yang masih harus diisi

- [ ] `modal_bahan` tiap varian — dari sekali produksi nyata
- [ ] `harga_satuan` tiap kemasan
- [ ] `upah_per_pcs` tiap produk
- [ ] `tambahan_modal` tiap extra
- [ ] Identitas toko di `src/constants/nota-constant.ts` (masih contoh)
- [ ] `title` di `src/app/layout.tsx` (masih bawaan Next)
