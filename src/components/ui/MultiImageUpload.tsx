import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import { Button } from "./button";
import FallbackImage from "@/components/shared/FallbackImage";

type Props = {
  value?: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  max?: number;
};

export default function MultiImageUpload({ value = [], onChange, disabled, max = 3 }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = (value || []).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [value]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) return;
      const current = value || [];
      const remaining = Math.max(0, max - current.length);
      const next = [...current, ...acceptedFiles.slice(0, remaining)];
      onChange(next);
      
      // Toast de feedback immédiat
      if (acceptedFiles.length > remaining) {
        toast.warning(`Seulement ${remaining} image(s) ajoutée(s). Maximum ${max} autorisé.`);
      } else {
        toast.success(`${acceptedFiles.length} image(s) ajoutée(s)`);
      }
    },
    [onChange, value, max]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    multiple: true,
    disabled,
    maxFiles: max,
  });
  const inputProps = getInputProps({ name: "imagesFiles", id: "imagesFiles", autoComplete: "off" });

  const removeAt = (idx: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const next = (value || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input {...inputProps} />
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-full aspect-square">
                <FallbackImage src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={removeAt(i)}
                  className="absolute top-2 right-2 h-7 w-7"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {value.length < max && (
              <div className="flex items-center justify-center border-2 border-dashed rounded-md min-h-[96px] text-sm text-gray-500">
                + Ajouter ({max - value.length} restant{max - value.length > 1 ? "s" : ""})
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-500">
              {isDragActive ? "Déposez les images ici..." : "Glissez-déposez des images, ou cliquez pour sélectionner (max " + max + ")"}
            </p>
            <p className="text-xs text-gray-400">JPEG/PNG/WEBP jusqu'à 5 Mo</p>
          </div>
        )}
      </div>
    </div>
  );
}
