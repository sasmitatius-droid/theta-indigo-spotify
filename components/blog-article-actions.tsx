'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogArticleActionsProps {
  title: string;
  excerpt: string;
  targetId: string; // The ID of the HTML element to convert to PDF
}

export function BlogArticleActions({ title, excerpt, targetId }: BlogArticleActionsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisAvailable(true);
      // Clean up any ongoing speech on unmount
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Pre-load voices for mobile Safari which sometimes needs a poke
  useEffect(() => {
    if (speechSynthesisAvailable) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [speechSynthesisAvailable]);

  const handleToggleSpeech = () => {
    if (!speechSynthesisAvailable) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Find the article text content
      const articleEl = document.getElementById(targetId);
      if (articleEl) {
        // Clean text from weird characters and extra spaces, and append closing domain speech
        const closingSpeech = ' Terima kasih telah mendengarkan Theta Indigo Podcast. Kunjungi situs resmi kami di www.indigoblueprint.my.id.';
        const fullText = `${title}. ${excerpt}. ${articleEl.innerText}.${closingSpeech}`;
        const cleanText = fullText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Chunk text by sentences to prevent Android Chrome TTS bug (fails on long strings)
        // Split by punctuation marks: ., !, ?
        const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
        
        window.speechSynthesis.cancel(); // Clear any stuck queues
        setIsPlaying(true);
        
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang.toLowerCase().includes('id'));
        
        chunks.forEach((chunk, index) => {
          // Avoid empty chunks
          if (!chunk.trim()) return;
          
          const utterance = new SpeechSynthesisUtterance(chunk.trim());
          if (idVoice) {
            utterance.voice = idVoice;
          }
          
          // Slightly slower rate often sounds more natural
          utterance.rate = 0.95;

          // Only the last chunk should trigger the stop playing state
          if (index === chunks.length - 1) {
            utterance.onend = () => setIsPlaying(false);
          }
          
          utterance.onerror = (e) => {
            console.error('TTS Error on chunk:', e);
            setIsPlaying(false);
          };

          window.speechSynthesis.speak(utterance);
        });
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfLoading(true);
      const articleEl = document.getElementById(targetId);
      if (!articleEl) throw new Error('Article element not found');

      // Dynamically import html2pdf so it only loads on client side
      // @ts-ignore - html2pdf doesn't always have types
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(articleEl).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Gagal membuat PDF. Pastikan koneksi internet stabil.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-y border-slate-800/50 my-6">
      <span className="text-sm font-semibold text-slate-400 mr-2">Fitur Artikel:</span>
      
      {speechSynthesisAvailable && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSpeech}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isPlaying 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-4 h-4" /> Berhenti Membaca
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" /> Dengarkan Artikel
            </>
          )}
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownloadPdf}
        disabled={isPdfLoading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPdfLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> Simpan PDF
          </>
        )}
      </motion.button>
    </div>
  );
}
