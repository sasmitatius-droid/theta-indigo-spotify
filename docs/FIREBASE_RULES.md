# Catatan Firebase Rules — Theta Indigo Blueprint

## Masalah umum

Jika halaman **Admin** stuck di "Memeriksa otorisasi..." atau console menampilkan:

`FirebaseError: Missing or insufficient permissions`

artinya **Firestore Security Rules** di Firebase Console belum sesuai dengan koleksi baru (`adminUsers`, `admins`, dll.).

## Langkah deploy rules

1. Buka [Firebase Console](https://console.firebase.google.com) → proyek Anda → **Firestore Database** → tab **Rules**.
2. Salin isi file `firestore.rules` di root repo proyek ini.
3. Klik **Publish**.
4. (Opsional) Dari folder proyek dengan Firebase CLI terpasang:

```bash
firebase deploy --only firestore:rules
```

## Koleksi & akses (ringkas)

| Koleksi        | Baca                         | Tulis                          |
|----------------|------------------------------|--------------------------------|
| `users`        | Pemilik + admin              | Pemilik + admin                |
| `packages`     | Semua orang (landing/premium)| Admin panel                    |
| `blogs`        | Semua orang (halaman blog)   | Admin panel                    |
| `readings`     | Pemilik + admin              | User buat; admin kelola        |
| `admins/{uid}` | UID sendiri + super admin    | Hanya super admin              |
| `adminUsers`   | Admin panel + baris email sendiri | Admin panel              |
| `transactions` | **Tidak ada** (client)       | Hanya server (Midtrans API)    |

## Super admin (hardcoded di rules + app)

Email berikut selalu dianggap admin penuh:

- `tiuss168@gmail.com`
- `admin@example.com`

Tambahkan admin lain tanpa mengubah rules:

1. **Firestore** → koleksi `admins` → dokumen ID = `UID` Firebase Auth admin tersebut, atau
2. Koleksi `adminUsers` → dokumen dengan field `email` (lowercase) + `permissions` (lihat `lib/admin-permissions.ts`).

## Index Firestore

Query `adminUsers` where `email == ...` tidak wajib composite index (single field).

## Environment variables (Vercel / .env.local)

Pastikan terisi:

- `NEXT_PUBLIC_FIREBASE_*` (client)
- `FIREBASE_SERVICE_ACCOUNT` atau kredensial Admin SDK (notifikasi Midtrans)
- `NEXT_PUBLIC_TINYMCE_API_KEY` (opsional; tanpa key editor memakai mode GPL self-hosted)

## Koleksi `admins` (otomatis)

Saat super admin (`tiuss168@gmail.com`) login ke dashboard/admin, aplikasi membuat dokumen:

`admins/{UID_ANDA}` dengan field `email`, `role: super_admin`, `unlimitedAnalysis: true`.

Juga memperbarui `users/{UID}`: `isAdmin: true`, `analysisUnlimited: true`, `subscription: Admin — Unlimited`.

## Analisis unlimited (admin)

Akun yang masuk daftar **super admin**, dokumen `admins/{uid}`, atau `adminUsers` (email cocok) otomatis **unlimited** membuat analisis di dashboard.

Untuk memberi unlimited ke **user biasa**: Admin → Pengguna → tombol **∞**.

## Paket 10 analisis

Setelah pembayaran Midtrans sukses, field `analysisRemaining` di `users` diisi (mis. `10`). Setiap generate analisis berkurang 1. **Analisis ke-11 diblokir** sampai user membeli paket lagi.

## Blog kategori

Field `category` pada koleksi `blogs` dipakai untuk sub menu di landing. Rules `blogs`: read publik, write admin.

## Setelah publish rules

1. Hard refresh browser (Ctrl+Shift+R).
2. Login ulang dengan akun super admin.
3. Buka `/admin` — seharusnya tidak stuck loading.

## PWA meta (bukan error Firebase)

Peringatan `apple-mobile-web-app-capable is deprecated` sudah ditangani di `app/layout.tsx` dengan meta `mobile-web-app-capable`.

## Google Sign-In & COOP

Jika popup Google tertutup dengan pesan COOP, `next.config.js` sudah mengatur `Cross-Origin-Opener-Policy: same-origin-allow-popups` untuk rute auth.
