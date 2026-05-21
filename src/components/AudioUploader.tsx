'use client';

import { useCallback, useState } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function AudioUploader({ onFileSelect, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = () => setSelectedFile(null);

  if (selectedFile) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800/70 hover:border-zinc-600 transition-all">
        <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
          <FileAudio className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white truncate">{selectedFile.name}</p>
          <p className="text-sm text-zinc-400 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon" onClick={clearFile} className="flex-shrink-0 text-zinc-500 hover:text-white hover:bg-zinc-700 w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('audio-input')?.click()}
      className={`border-2 border-dashed rounded-xl p-14 text-center transition-all cursor-pointer
        ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.1)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-zinc-800 border border-zinc-700">
          <Upload className="w-7 h-7 text-zinc-400" />
        </div>
        <div>
          <p className="text-base font-medium text-white mb-1">Drop your audio file here</p>
          <p className="text-sm text-zinc-500">MP3, WAV, M4A up to 25MB</p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {['EN','ES','FR','DE','PT','ZH','JA','KO','IT','AR'].map(lang => (
              <span key={lang} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-500 tracking-wide">{lang}</span>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); document.getElementById('audio-input')?.click(); }}
          className="mt-1 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white px-5 h-9"
        >
          Browse files
        </Button>
      </div>
      <input
        id="audio-input"
        type="file"
        accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        disabled={disabled}
      />
    </div>
  );
}
