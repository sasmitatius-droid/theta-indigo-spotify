'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { loadRememberedAuth, saveRememberedAuth, clearRememberedAuth } from '@/lib/auth-storage';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const saved = loadRememberedAuth();
    if (saved) {
      setFormData((prev) => ({ ...prev, email: saved.email, password: saved.password }));
      setRememberMe(true);
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) router.push('/dashboard');
    });
  }, [router]);

  const saveUserProfile = async (uid: string, email: string | null, name?: string | null) => {
    await setDoc(
      doc(db, 'users', uid),
      {
        email: email || '',
        name: name || email || 'Pengguna Theta Indigo',
        subscription: 'Tidak Ada',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await saveUserProfile(credential.user.uid, credential.user.email, credential.user.displayName);
        if (rememberMe) {
          saveRememberedAuth({ email: formData.email, password: formData.password, remember: true });
        } else {
          clearRememberedAuth();
        }
      } else {
        const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(credential.user, { displayName: formData.name });
        await saveUserProfile(credential.user.uid, credential.user.email, formData.name);
      }
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Autentikasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await saveUserProfile(credential.user.uid, credential.user.email, credential.user.displayName);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message || 'Login Google gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid untuk mereset kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccessMsg('Tautan reset kata sandi telah dikirim. Periksa kotak masuk atau folder spam Anda.');
    } catch (error: any) {
      setErrorMsg(error.message || 'Reset kata sandi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_30%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              {isForgotPassword ? 'Reset Kata Sandi' : isLogin ? 'Selamat Datang Kembali' : 'Buat Akun'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isForgotPassword
                ? 'Masukkan email Anda untuk menerima tautan reset kata sandi'
                : isLogin
                  ? 'Masuk untuk melanjutkan perjalanan spiritual Anda'
                  : 'Mulai perjalanan spiritual Anda hari ini'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isForgotPassword && (
              <>
                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full text-gray-700 hover:bg-gray-50 border-gray-300"
                  disabled={isLoading}
                >
                  Lanjutkan dengan Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Atau lanjutkan dengan email</span>
                  </div>
                </div>
              </>
            )}

            {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{errorMsg}</div>}
            {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">{successMsg}</div>}

            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <EmailInput value={formData.email} onChange={(email) => setFormData({ ...formData, email })} />
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                  {isLoading ? 'Memproses...' : 'Kirim Tautan Reset'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Kembali ke halaman masuk
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Nama Anda"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 text-gray-900 border-gray-300 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <EmailInput value={formData.email} onChange={(email) => setFormData({ ...formData, email })} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-800">Kata Sandi</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Lupa Kata Sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 text-gray-900 border-gray-300 focus:border-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Ingat email & kata sandi di perangkat ini
                  </label>
                )}

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                  {isLoading ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}
                </Button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="text-center text-sm">
                <span className="text-gray-600">{isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}</span>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {isLogin ? 'Daftar' : 'Masuk'}
                </button>
              </div>
            )}

            <div className="text-center pt-4 border-t border-gray-100">
              <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600 font-medium">
                Kembali ke Beranda
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

function EmailInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-800">Alamat Email</label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="email"
          placeholder="anda@contoh.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 text-gray-900 border-gray-300 focus:border-indigo-500"
          required
        />
      </div>
    </div>
  );
}
