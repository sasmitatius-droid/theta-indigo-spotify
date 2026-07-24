import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-lg p-8 shadow-xl space-y-6">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
          Kembali ke Beranda
        </Link>
        <h1 className="text-3xl font-bold text-indigo-900">Kebijakan Privasi</h1>
        <p>
          Kami menyimpan data akun seperti nama dan email melalui Firebase Authentication dan Firestore. Data input analisis
          digunakan untuk menghasilkan hasil spiritual dan menyimpan riwayat pengguna yang login.
        </p>
        <p>
          Detail pembayaran diproses oleh Midtrans. Aplikasi tidak menyimpan nomor kartu, PIN, CVV, atau kredensial bank.
        </p>
        <p>
          Hubungi pengelola Theta Indigo jika Anda ingin memperbarui atau menghapus data akun Anda.
        </p>
      </div>
    </main>
  );
}
