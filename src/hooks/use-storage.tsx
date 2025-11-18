
import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Define a type for the progress handler function
type ProgressHandler = (progress: number) => void;

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Uploads a file to Firebase Storage with progress tracking.
   * @param file The file to upload.
   * @param path The path in storage where the file should be saved.
   * @param onProgress Optional callback to report upload progress (0-100).
   * @returns A promise that resolves with the public download URL.
   */
  const uploadFile = (file: File, path: string, onProgress?: ProgressHandler): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setError(null);

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Listen for state changes, errors, and completion of the upload.
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error);
          setError(error);
          setIsUploading(false);
          reject(new Error("File upload failed."));
        },
        async () => {
          // Handle successful uploads on complete
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            resolve(downloadURL);
          } catch (e: any) {
            console.error("Could not get download URL:", e);
            setError(e);
            setIsUploading(false);
            reject(new Error("Could not get file URL after upload."));
          }
        }
      );
    });
  };

  return { isUploading, error, uploadFile };
};
