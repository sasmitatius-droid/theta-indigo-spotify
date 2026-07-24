import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-lg p-8 shadow-xl space-y-6">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
          Kembali ke Beranda
        </Link>
        <h1 className="text-3xl font-bold text-indigo-900">Ketentuan Berlaku</h1>
        <p>
          Theta Indigo Blueprint menyediakan analisis spiritual dan numerologi untuk refleksi pribadi. Hasil analisis bukan
          pengganti nasihat medis, hukum, keuangan, psikologis, atau keputusan profesional lainnya.
        </p>
        <p>
          Pembayaran premium diproses melalui Midtrans Production. Akses premium diaktifkan setelah pembayaran berhasil
          diverifikasi oleh notifikasi resmi Midtrans.
        </p>
        <p>
          Dengan menggunakan layanan ini, pengguna menyetujui penggunaan data akun dan input analisis untuk menjalankan fitur
          aplikasi, menyimpan riwayat bacaan, dan memproses transaksi yang dipilih pengguna.
        </p>
      </div>
    </main>
  );
}
