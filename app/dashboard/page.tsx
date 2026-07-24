'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CreditCard, LogOut, Shield, Sparkles, Home, ArrowLeft } from 'lucide-react';
import { ReadingForm } from '@/components/reading-form';
import { ReadingResult } from '@/components/reading-result';
import { ReadingResult as ReadingResultType } from '@/types';
import { generateCompleteReading, type ReadingFormPayload } from '@/lib/generate-reading';
import { calculateAura, calculateChakra, calculateNumerology, classifyIndigo } from '@/lib/spiritual-engine';
import { calculateHumanDesign } from '@/lib/human-design';
import { normalizePackage, type SubscriptionPackage } from '@/lib/package-types';
import { getUserSubscriptionState } from '@/lib/subscription-client';
import { resolveAdminAccess, ensureSuperAdminSetup } from '@/lib/admin-auth-client';
import { PackageFeaturesList } from '@/components/package-features-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: Record<string, (result: unknown) => void>) => void;
    };
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'reading' | 'premium'>('reading');
  const [user, setUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [subscriptionLabel, setSubscriptionLabel] = useState('');
  const [analysisRemaining, setAnalysisRemaining] = useState<number | null>(null);
  const [canCreateAnalysis, setCanCreateAnalysis] = useState(true);
  const [quotaMessage, setQuotaMessage] = useState('');
  const [result, setResult] = useState<ReadingResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState('');
  const [message, setMessage] = useState('');
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'premium') {
      setActiveTab('premium');
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await ensureSuperAdminSetup(firebaseUser);
          const access = await resolveAdminAccess(firebaseUser);
          setShowAdminLink(access.allowed);
        } catch (e) {
          console.warn('Setup admin:', e);
          setShowAdminLink(false);
        }

        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email || 'Pengguna Theta Indigo',
          }),
        });
        const sub = await getUserSubscriptionState(firebaseUser.uid, firebaseUser.email);
        setSubscriptionLabel(sub.subscription);
        setAnalysisRemaining(sub.analysisRemaining);
        setCanCreateAnalysis(sub.canCreateAnalysis);
        setQuotaMessage(sub.reason || '');
      } else {
        setSubscriptionLabel('');
        setAnalysisRemaining(1);
        setCanCreateAnalysis(true);
        setQuotaMessage('');
      }
    });
  }, []);

  useEffect(() => {
    setPackagesLoading(true);
    fetch('/api/packages')
      .then((res) => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then((loaded) => {
        setPackages(loaded);
      })
      .catch(() => setPackages([]))
      .finally(() => setPackagesLoading(false));
  }, []);

  const snapClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const snapSrc = useMemo(() => 'https://app.midtrans.com/snap/snap.js', []);

  const refreshSubscription = async (uid: string) => {
    const sub = await getUserSubscriptionState(uid, user?.email);
    setSubscriptionLabel(sub.subscription);
    setAnalysisRemaining(sub.analysisRemaining);
    setCanCreateAnalysis(sub.canCreateAnalysis);
    setQuotaMessage(sub.reason || '');
  };

  const handleFormSubmit = async (data: ReadingFormPayload) => {
    if (user) {
      const sub = await getUserSubscriptionState(user.uid, user.email);
      if (!sub.canCreateAnalysis) {
        setMessage(sub.reason || 'Kuota analisis habis. Silakan beli paket.');
        setActiveTab('premium');
        return;
      }
    }

    setIsLoading(true);
    setMessage('');

    try {
      const birthDate = new Date(String(data.birthDate));
      const name = String(data.name);
      const numerology = calculateNumerology(birthDate, name);
      const indigoType = classifyIndigo(birthDate, name);
      const chakra = calculateChakra(birthDate, name);
      const aura = calculateAura(birthDate, name);
      const humanDesign = calculateHumanDesign(birthDate, data.birthTime as string | undefined);

      const readingResult = await generateCompleteReading(
        data,
        { numerology, indigoType, chakra, aura, humanDesign },
        user?.uid || 'guest',
      );

      setResult(readingResult);

      if (user) {
        const token = await user.getIdToken();
        const res = await fetch('/api/user/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...readingResult,
            input: { ...readingResult.input, birthDate: data.birthDate },
          }),
        });
        if (!res.ok) {
          throw new Error('Gagal menyimpan hasil analisis.');
        }
        await refreshSubscription(user.uid);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal membuat analisis spiritual.';
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (pkg: SubscriptionPackage) => {
    if (!user) {
      setMessage('Silakan masuk atau daftar terlebih dahulu sebelum membeli paket.');
      setActiveTab('premium');
      return;
    }

    if (!window.snap) {
      setMessage('Midtrans Snap belum siap. Tunggu beberapa detik lalu coba lagi.');
      return;
    }

    setIsPaying(pkg.id);
    setMessage('');

    try {
      const response = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          analysisQuota: pkg.analysisQuota,
          durationDays: pkg.durationDays,
          unlimited: pkg.unlimited,
          userId: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Gagal membuat transaksi.');

      window.snap.pay(payload.token, {
        onSuccess: () => {
          setMessage('Pembayaran berhasil. Paket akan aktif setelah notifikasi Midtrans diproses.');
          setTimeout(() => refreshSubscription(user.uid), 3000);
        },
        onPending: () => setMessage('Pembayaran tertunda. Selesaikan instruksi pembayaran dari Midtrans.'),
        onError: () => setMessage('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => setMessage('Popup pembayaran ditutup sebelum selesai.'),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal memulai pembayaran.';
      setMessage(msg);
    } finally {
      setIsPaying('');
    }
  };

  const quotaLabel =
    analysisRemaining === null
      ? 'Unlimited'
      : analysisRemaining !== undefined
        ? `${analysisRemaining} tersisa`
        : '';

  const quotaHint =
    subscriptionLabel === 'Tidak Ada'
      ? 'Akun gratis: 1 analisis. Setelah habis, beli paket.'
      : analysisRemaining !== null && analysisRemaining > 0
        ? `Setelah ${analysisRemaining} analisis ini habis, Anda perlu membeli paket lagi.`
        : '';

  return (
    <main className="min-h-screen px-4 py-8">
      {snapClientKey && <Script src={snapSrc} data-client-key={snapClientKey} strategy="afterInteractive" />}

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-700">Theta Indigo Dashboard</p>
            <h1 className="text-4xl font-bold text-black">Ruang Analisis Spiritual</h1>
            {user && (
              <p className="text-sm text-gray-600 mt-1">
                Langganan: <span className="font-semibold text-black">{subscriptionLabel}</span>
                {quotaLabel ? ` · Kuota analisis: ${quotaLabel}` : ''}
              </p>
            )}
            {quotaHint && activeTab === 'reading' && (
              <p className="text-xs text-gray-500 mt-1">{quotaHint}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
                <Home className="w-4 h-4 mr-2" />
                Landing Page
              </Button>
            </Link>
            {showAdminLink && (
              <Link href="/admin">
                <Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            {user ? (
              <Button variant="outline" onClick={() => auth.signOut()} className="border-gray-300 text-black hover:bg-gray-100">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            ) : (
              <Link href="/auth">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Masuk</Button>
              </Link>
            )}
          </div>
        </header>

        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={() => setActiveTab('reading')} variant={activeTab === 'reading' ? 'default' : 'outline'}>
            <Sparkles className="w-4 h-4 mr-2" />
            Analisis
          </Button>
          <Button onClick={() => setActiveTab('premium')} variant={activeTab === 'premium' ? 'default' : 'outline'}>
            <CreditCard className="w-4 h-4 mr-2" />
            Premium
          </Button>
          <Link href="/" className="ml-auto">
            <Button variant="ghost" className="text-black hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Landing Page
            </Button>
          </Link>
        </div>

        {message && <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4 text-gray-900">{message}</div>}
        {quotaMessage && activeTab === 'reading' && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">{quotaMessage}</div>
        )}

        {activeTab === 'reading' ? (
          result ? (
            <ReadingResult
              result={result}
              onBackToDashboard={() => setResult(null)}
              backToLandingHref="/"
              backButtonTheme="dark"
            />
          ) : (
            <ReadingForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              disabled={user ? !canCreateAnalysis : false}
            />
          )
        ) : (
          <section className="space-y-4">
            {packagesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white animate-pulse h-64 border-none" />
                ))}
              </div>
            ) : packages.length === 0 ? (
              <Card className="bg-white text-slate-950">
                <CardContent className="py-10 text-center text-gray-600">
                  Belum ada paket. Admin dapat menambahkan paket di panel Admin → Kelola Paket.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="bg-white text-slate-950 border-none">
                    <CardHeader>
                      <CardTitle>{pkg.name}</CardTitle>
                      <CardDescription>
                        {pkg.unlimited || pkg.analysisQuota === null
                          ? 'Analisis unlimited'
                          : `${pkg.analysisQuota} analisis`}{' '}
                        · {pkg.durationDays} hari
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="text-3xl font-bold">Rp{Number(pkg.price).toLocaleString('id-ID')}</div>
                      <PackageFeaturesList features={pkg.features || []} />
                      <Button
                        onClick={() => handlePayment(pkg)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={isPaying === pkg.id}
                      >
                        {isPaying === pkg.id ? 'Membuka Midtrans...' : 'Beli dengan Midtrans'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
