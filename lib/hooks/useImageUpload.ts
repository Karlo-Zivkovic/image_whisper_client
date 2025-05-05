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

      // Get MIME type and format extension first
      const { mimeType, extension, base64Data } = extractImageInfo(base64Image);

      // Convert base64 to file with proper content type
      const blob = base64ToBlob(base64Data, mimeType);

      // Always use consistent file extensions that work in browsers
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false,
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

  // Helper to extract all image information from base64 string
  const extractImageInfo = (
    base64Image: string
  ): { mimeType: string; extension: string; base64Data: string } => {
    // Parse the MIME type from the base64 string
    const match = base64Image.match(/^data:([^;]+);base64,(.*)$/);

    let mimeType = "image/jpeg"; // Default
    let base64Data = "";

    if (match && match.length >= 3) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      // If no match, just use the raw base64 data
      base64Data = base64Image.split(",")[1] || base64Image;
    }

    // Map MIME types to browser-friendly extensions
    const extensionMap: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
    };

    // Get extension from mime type
    const extension = extensionMap[mimeType] || "jpg";

    return { mimeType, extension, base64Data };
  };

  // Helper function to convert base64 to blob with proper content type
  const base64ToBlob = (base64Data: string, contentType: string): Blob => {
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

    // Create blob with the proper content type
    return new Blob(byteArrays, { type: contentType });
  };

  return {
    uploadImage,
    isUploading,
  };
}
