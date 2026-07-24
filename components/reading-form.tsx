'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Calendar, MapPin, Target, Clock, User, Sparkles } from 'lucide-react';

interface ReadingFormData {
  name: string;
  birthDate: string;
  birthTime?: string;
  gender?: string;
  country?: string;
  city?: string;
  spiritualGoal?: string;
}

interface ReadingFormProps {
  onSubmit: (data: ReadingFormData) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const LOADING_MESSAGES = [
  "System menganalisis profil numerologi Anda...",
  "Membaca energi chakra dan aura secara mendalam...",
  "Menyusun afirmasi dan bacaan spiritual personal...",
  "Menggali cetak biru indigo Anda...",
  "Menyelesaikan laporan spiritual lengkap..."
];

export function ReadingForm({ onSubmit, isLoading = false, disabled = false }: ReadingFormProps) {
  const [formData, setFormData] = useState<ReadingFormData>({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: '',
    country: '',
    city: '',
    spiritualGoal: '',
  });
  const [messageIndex, setMessageIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.birthDate) {
      // Format kapitalisasi otomatis untuk Nama Lengkap (contoh: "budi santoso" -> "Budi Santoso")
      const formattedName = formData.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      onSubmit({ ...formData, name: formattedName });
    }
  };

  const handleChange = (field: keyof ReadingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000); // Ganti teks setiap 2 detik
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Temukan Cetak Biru Spiritual Anda
          </CardTitle>
          <CardDescription className="text-gray-600">
            Masukkan detail Anda untuk mengungkap wawasan spiritual unik Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <User className="w-4 h-4" />
                Nama Lengkap *
              </label>
              <Input
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Calendar className="w-4 h-4" />
                Tanggal Lahir *
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Clock className="w-4 h-4" />
                Waktu Lahir (Opsional)
              </label>
              <Input
                type="time"
                value={formData.birthTime}
                onChange={(e) => handleChange('birthTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                Jenis Kelamin (Opsional)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
                <option value="other">Lainnya</option>
                <option value="prefer-not-to-say">Memilih untuk tidak menjawab</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <MapPin className="w-4 h-4" />
                  Negara
                </label>
                <Input
                  type="text"
                  placeholder="Negara Anda"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <MapPin className="w-4 h-4" />
                  Kota
                </label>
                <Input
                  type="text"
                  placeholder="Kota Anda"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Target className="w-4 h-4" />
                Tujuan Spiritual Saat Ini
              </label>
              <Textarea
                placeholder="Apa yang Anda cari dalam perjalanan spiritual Anda?"
                value={formData.spiritualGoal}
                onChange={(e) => handleChange('spiritualGoal', e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              disabled={disabled || isLoading || !formData.name || !formData.birthDate}
            >
              {isLoading ? LOADING_MESSAGES[messageIndex] : 'Ungkap Cetak Biru Spiritual Saya'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
