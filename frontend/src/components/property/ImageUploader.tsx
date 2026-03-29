'use client';
import { useState, useRef } from 'react';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/lib/useImageUpload';
import toast from 'react-hot-toast';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ value, onChange, maxImages = 15 }: Props) {
  const { upload, uploading, progress } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files).slice(0, maxImages - value.length);

    for (const file of fileArr) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      try {
        const { publicUrl } = await upload(file, 'property');
        onChange([...value, publicUrl]);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        {uploading ? (
          <div>
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <div className="text-sm text-blue-600 font-medium">Uploading… {progress}%</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full max-w-xs mx-auto">
              <div
                className="h-1.5 bg-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Drop photos here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, WEBP up to 10MB each · {value.length}/{maxImages} uploaded
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-xs py-0.5 text-center">
                  Cover
                </div>
              )}
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
