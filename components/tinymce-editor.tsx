'use client';

import { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

type TinyMceEditorProps = {
  value: string;
  onChange: (html: string) => void;
  height?: number;
  disabled?: boolean;
};

export function TinyMceEditor({ value, onChange, height = 420, disabled = false }: TinyMceEditorProps) {
  const [mounted, setMounted] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[320px] rounded-md border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
        Memuat editor TinyMCE...
      </div>
    );
  }

  // If no API key, show a simple textarea as fallback
  if (!apiKey) {
    return (
      <div className="rounded-md overflow-hidden border border-gray-300 bg-white">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ height: `${height}px` }}
          className="w-full p-4 text-base font-sans leading-relaxed resize-y focus:outline-none"
          placeholder="Tulis konten artikel di sini..."
        />
        <p className="text-xs text-gray-500 px-3 py-2 border-t bg-gray-50">
          Editor sederhana (tanpa TinyMCE). Untuk fitur lengkap, tambahkan <code className="text-indigo-700">NEXT_PUBLIC_TINYMCE_API_KEY</code> di environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="tinymce-wrapper rounded-md overflow-hidden border border-gray-300 bg-white">
      <Editor
        apiKey={apiKey || undefined}
        licenseKey="gpl"
        disabled={disabled}
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'help',
            'wordcount',
          ],
          toolbar:
            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code fullscreen help',
          content_style:
            'body { font-family: Inter, system-ui, sans-serif; font-size: 16px; line-height: 1.65; color: #1e293b; max-width: 720px; margin: 1rem auto; } img { max-width: 100%; height: auto; }',
          branding: false,
          promotion: false,
          resize: true,
          paste_data_images: true,
          automatic_uploads: false,
        }}
      />
      {!apiKey && (
        <p className="text-xs text-gray-500 px-3 py-2 border-t bg-gray-50">
          Editor TinyMCE mode GPL. Opsional: set <code className="text-indigo-700">NEXT_PUBLIC_TINYMCE_API_KEY</code> di
          environment variables untuk CDN Tiny Cloud.
        </p>
      )}
    </div>
  );
}
