import { useState } from 'react';

// Define a type for the progress handler function
type ProgressHandler = (progress: number) => void;

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Uploads a file (or an already-compressed Blob) to our own hosting via
   * /api/upload, with progress tracking. XMLHttpRequest rather than fetch
   * because fetch still can't report upload progress.
   * @param file The file or blob to upload.
   * @param path Where to store it, e.g. `companies/<id>/logo-<uuid>.webp`.
   * @param onProgress Optional callback to report upload progress (0-100).
   * @returns A promise that resolves with the public URL of the file.
   */
  const uploadFile = (file: Blob, path: string, onProgress?: ProgressHandler): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setError(null);

      const fail = (message: string) => {
        const err = new Error(message);
        console.error("Upload failed:", message);
        setError(err);
        setIsUploading(false);
        reject(err);
      };

      const body = new FormData();
      body.append('file', file);
      body.append('path', path);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress((event.loaded / event.total) * 100);
        }
      };
      xhr.onerror = () => fail("File upload failed.");
      xhr.onload = () => {
        let response: { url?: string; error?: string } = {};
        try {
          response = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON error page from the server
        }
        if (xhr.status >= 200 && xhr.status < 300 && response.url) {
          setIsUploading(false);
          resolve(response.url);
        } else {
          fail(response.error || "File upload failed.");
        }
      };
      xhr.send(body);
    });
  };

  return { isUploading, error, uploadFile };
};
