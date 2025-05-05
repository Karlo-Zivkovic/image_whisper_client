import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

type UseDragAndDropProps = {
  onFileProcessed: (file: File) => void;
  fileTypes?: string;
  maxSizeInMB?: number;
};

export function useDragAndDrop({
  onFileProcessed,
  fileTypes = "image.*",
  maxSizeInMB = 10,
}: UseDragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropAreaRef = useRef<HTMLLabelElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.match(fileTypes)) {
      toast.error(`Only ${fileTypes} files are supported`);
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      onFileProcessed(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent false dragLeave events when dragging over child elements
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Only set dragging to false if we've actually left the drop area
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Add global drag events to highlight the drop area when dragging anywhere on the page
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDragging(false);
      }
    };

    const handleGlobalDrop = () => {
      setIsDragging(false);
    };

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("dragleave", handleGlobalDragLeave);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("dragleave", handleGlobalDragLeave);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processFile(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return {
    isDragging,
    isUploading,
    dropAreaRef,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
  };
}
