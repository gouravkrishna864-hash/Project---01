/**
 * useImageUpload
 * Handles the full client-side S3 upload flow:
 *   1. Request presigned URL from backend
 *   2. PUT file directly to S3
 *   3. Return the public URL
 */
import { useState, useCallback } from 'react';
import axios from 'axios';
import api from './api';

interface UploadResult {
  publicUrl: string;
  key: string;
}

interface UseImageUploadReturn {
  upload: (file: File, purpose?: 'property' | 'profile') => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File,
    purpose: 'property' | 'profile' = 'property'
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned URL
      const { data } = await api.post('/upload/presign', {
        filename: file.name,
        contentType: file.type,
        purpose,
      });

      const { uploadUrl, publicUrl, key } = data.data;

      // Step 2: Upload directly to S3
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      setProgress(100);
      return { publicUrl, key };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}
