import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImageUploader({ files = [], onChange, maxFiles = 3 }) {
  const [compressing, setCompressing] = useState(false);

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) {
      toast.error(`You can upload at most ${maxFiles} photos.`);
      return;
    }

    const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);
    setCompressing(true);

    const processedFiles = [];
    for (const file of filesToProcess) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`'${file.name}' is not a supported image format.`);
        continue;
      }

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        };
        const compressedBlob = await imageCompression(file, options);
        // Retain original name
        const compressedFile = new File([compressedBlob], file.name, {
          type: compressedBlob.type,
          lastModified: Date.now(),
        });

        const previewUrl = URL.createObjectURL(compressedFile);
        processedFiles.push({
          file: compressedFile,
          preview: previewUrl,
          name: file.name,
          sizeKb: Math.round(compressedFile.size / 1024),
        });
      } catch (err) {
        console.error('Compression failed:', err);
        // Fallback to original file
        const previewUrl = URL.createObjectURL(file);
        processedFiles.push({
          file,
          preview: previewUrl,
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        });
      }
    }

    setCompressing(false);
    onChange([...files, ...processedFiles]);
  };

  const removeFile = (index) => {
    const updated = [...files];
    const removed = updated.splice(index, 1)[0];
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      {files.length < maxFiles && (
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 transition-colors bg-slate-50/50 hover:bg-blue-50/30 text-center">
          <input
            type="file"
            id="report-photo-input"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={compressing}
          />
          <label
            htmlFor="report-photo-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              {compressing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {compressing ? 'Compressing photo...' : 'Click to take a photo or upload files'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                JPEG, PNG, WebP up to 5 MB ({files.length}/{maxFiles} attached)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 pt-1">
              <Camera className="w-4 h-4" />
              <span>Camera capture supported on mobile</span>
            </div>
          </label>
        </div>
      )}

      {/* Previews Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((item, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center"
            >
              <img
                src={item.preview}
                alt={`Upload preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition-colors shadow-sm"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2 text-[11px] text-white flex justify-between items-center">
                <span className="truncate max-w-[70%]">{item.name}</span>
                <span className="opacity-80">{item.sizeKb} KB</span>
              </div>
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-sm">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

