import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { resolveAssetUrl } from "../../services/uploadService";

export default function UploadBox({
  label,
  helpText,
  accept = ".pdf,application/pdf",
  error,
  asset,
  uploading = false,
  onFileChange,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = (fileList) => {
    const file = fileList?.[0];

    if (file && onFileChange) {
      onFileChange(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  };

  const openPicker = () => {
    inputRef.current?.click();
  };

  return (
    <div className="rounded-3xl border border-dashed border-gold/30 bg-white/5 p-5">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border border-dashed px-4 py-6 text-center transition ${
          isDragging ? "border-gold bg-gold/10" : "border-white/10 bg-black/10 hover:border-gold/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            handleFileSelection(event.target.files);
            event.target.value = "";
          }}
        />
        <Upload className="mx-auto h-6 w-6 text-gold-2" />
        <p className="mt-3 text-sm font-medium text-ivory">{label}</p>
        <p className="mt-2 text-sm text-muted">
          {uploading ? "Uploading brochure..." : helpText}
        </p>
      </div>

      {asset ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <a
            href={resolveAssetUrl(asset.downloadUrl || asset.url)}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 text-sm text-ivory hover:text-gold-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-gold-2" />
            <span className="truncate">{asset.name}</span>
          </a>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1 text-muted transition hover:bg-white/10 hover:text-ivory"
            aria-label="Remove brochure"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
