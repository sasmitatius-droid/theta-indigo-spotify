'use client';

import { useState } from 'react';
import { ReadingForm } from '@/components/reading-form';
import { ReadingResult } from '@/components/reading-result';
import { ReadingResult as ReadingResultType } from '@/types';
import { generateCompleteReading } from '@/lib/generate-reading';
import { calculateNumerology, classifyIndigo, calculateChakra, calculateAura } from '@/lib/spiritual-engine';
import { calculateHumanDesign } from '@/lib/human-design';

export default function DemoPage() {
  const [result, setResult] = useState<ReadingResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');

    try {
      const birthDate = new Date(data.birthDate);
      const numerology = calculateNumerology(birthDate, data.name);
      const indigoType = classifyIndigo(birthDate, data.name);
      const chakra = calculateChakra(birthDate, data.name);
      const aura = calculateAura(birthDate, data.name);
      const humanDesign = calculateHumanDesign(birthDate, data.birthTime);

      const readingResult = await generateCompleteReading(
        data,
        { numerology, indigoType, chakra, aura, humanDesign },
        'guest',
      );

      setResult(readingResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat analisis spiritual.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {!result ? (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Demo Mode
              </h1>
              <p className="text-gray-300 text-lg">
                Analisis spiritual mendalam dengan System — tanpa perlu mendaftar
              </p>
            </div>
            {error && (
              <div className="mb-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-red-100 text-center">
                {error}
              </div>
            )}
            <ReadingForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div>
            <ReadingResult
              result={result}
              onBackToDashboard={() => setResult(null)}
              backToLandingHref="/"
            />
          </div>
        )}
      </div>
    </div>
  );
}
