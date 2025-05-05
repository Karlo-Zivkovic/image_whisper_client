import { useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { v4 as uuidv4 } from "uuid";

interface UseImageUploadReturn {
  uploadImage: (
    file: string,
    bucket?: string,
    folder?: string
  ) => Promise<{
    url: string | null;
    path: string | null;
    error: Error | null;
  }>;
  isUploading: boolean;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (
    base64Image: string,
    bucket = "images",
    folder = "image_query"
  ) => {
    try {
      setIsUploading(true);

      // Convert base64 to file
      const base64Data = base64Image.split(",")[1];
      const blob = base64ToBlob(base64Data);

      const fileExt = getFileExtensionFromBase64(base64Image);
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: data?.path || filePath,
        error: null,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      return {
        url: null,
        path: null,
        error: error as Error,
      };
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64Data: string): Blob => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);

      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays);
  };

  // Helper to extract file extension from base64 string
  const getFileExtensionFromBase64 = (base64String: string): string => {
    const match = base64String.match(/^data:image\/(\w+);base64,/);
    return match ? match[1] : "jpeg"; // Default to jpeg if not found
  };

  return {
    uploadImage,
    isUploading,
  };
}
