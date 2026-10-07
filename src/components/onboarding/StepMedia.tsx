"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMediaQuota } from "@/lib/boostTiers";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface MediaFile {
  id: string;                   // local uuid for UI key
  file: File;
  preview: string;              // object URL for preview
  isVideo: boolean;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;             // 0-100
  r2Key?: string;               // set after successful upload
  errorMsg?: string;
}

interface StepMediaProps {
  onBack: () => void;
  onNext: (keys: string[]) => void;  // called with committed R2 keys
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MAX_VIDEO_MB = 20;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validate a single file before adding
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, WEBP, MP4, WEBM and MOV files are allowed.";
  }
  const isVideo = file.type.startsWith("video/");
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return `${isVideo ? "Videos" : "Images"} must be under ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB.`;
  }
  return null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Upload a single file: presign â†’ PUT to R2
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function uploadToR2(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  const token = localStorage.getItem("bf_token");

  // 1. Get presigned URL from our backend
  const presignRes = await fetch(`${API}/api/media/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mimeType: file.type,
      sizeBytes: file.size,
      scope: "profile",
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json();
    throw new Error(
      friendlyApiMessage(err.message, "We couldn't prepare that upload."),
    );
  }

  const { uploadUrl, key } = await presignRes.json();

  // 2. PUT directly to R2 with XMLHttpRequest so we get progress events
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`R2 upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

  return key;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Thumbnail card
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MediaCard({
  item,
  onRemove,
}: {
  item: MediaFile;
  onRemove: () => void;
}) {
  return (
    <div className="relative group rounded-2xl overflow-hidden bg-[#0F172A] aspect-square border-2 border-[#E2E8F0]">
      {/* Preview */}
      {item.isVideo ? (
        <video
          src={item.preview}
          className="w-full h-full object-cover opacity-90"
          muted
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.preview}
          alt="preview"
          className="w-full h-full object-cover"
        />
      )}

      {/* Video badge */}
      {item.isVideo && (
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
            <path d="M2 2l6 3-6 3V2z" />
          </svg>
          <span className="text-white text-[10px] font-medium">Video</span>
        </div>
      )}

      {/* Status overlay */}
      {item.status === "uploading" && (
        <div className="absolute inset-0 bg-[#0F172A]/70 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white text-xs font-medium">{item.progress}%</span>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-[#3B82F6] transition-all duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.status === "done" && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {item.status === "error" && (
        <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 p-2">
          <span className="text-2xl">âš ï¸</span>
          <span className="text-white text-[10px] text-center leading-tight">{item.errorMsg}</span>
        </div>
      )}

      {/* Remove button â€” only when not uploading */}
      {item.status !== "uploading" && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          aria-label="Remove"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Empty slot (add button)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmptySlot({ onClick, isFirst }: { onClick: () => void; isFirst: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all
        ${isFirst
          ? "border-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE]"
          : "border-[#CBD5E1] bg-white hover:border-[#93C5FD] hover:bg-[#F8FBFF]"
        }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        ${isFirst ? "bg-[#3B82F6]" : "bg-[#E2E8F0]"}`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2v8M2 6h8" stroke={isFirst ? "white" : "#94A3B8"} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <span className={`text-[10px] font-medium ${isFirst ? "text-[#3B82F6]" : "text-[#94A3B8]"}`}>
        {isFirst ? "Add photo/video" : "Add more"}
      </span>
    </button>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 9 â€” Media upload
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function StepMedia({ onBack, onNext }: StepMediaProps) {
  const { user } = useAuth();
  const quota = getMediaQuota(user?.boostTier);
  const maxFiles = quota.photos + quota.videos;
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<MediaFile[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const doneCount = files.filter((f) => f.status === "done").length;
  const hasUploading = files.some((f) => f.status === "uploading");
  const hasErrors = files.some((f) => f.status === "error");
  const canContinue = doneCount >= 1 && !hasUploading && !hasErrors;

  // â”€â”€ Add files from picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    addFiles(picked);
  }

  function addFiles(picked: File[]) {
    setGlobalError("");
    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      setGlobalError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    const toAdd = picked.slice(0, remaining);
    if (picked.length > remaining) {
      setGlobalError(`Only ${remaining} more file${remaining > 1 ? "s" : ""} can be added (max ${maxFiles}).`);
    }

    const currentCounts = files.reduce(
      (acc, item) => {
        if (item.status === "error") return acc;
        if (item.isVideo) acc.videos += 1;
        else acc.photos += 1;
        return acc;
      },
      { photos: 0, videos: 0 },
    );

    const newItems: MediaFile[] = [];

    for (const file of toAdd) {
      const err = validateFile(file);
      const isVideo = file.type.startsWith("video/");
      const preview = URL.createObjectURL(file);
      const id = uid();

      if (!err) {
        if (isVideo && currentCounts.videos >= quota.videos) {
          setGlobalError(`Your plan allows up to ${quota.photos} photos and ${quota.videos} videos.`);
          URL.revokeObjectURL(preview);
          continue;
        }
        if (!isVideo && currentCounts.photos >= quota.photos) {
          setGlobalError(`Your plan allows up to ${quota.photos} photos and ${quota.videos} videos.`);
          URL.revokeObjectURL(preview);
          continue;
        }
      }

      if (err) {
        newItems.push({ id, file, preview, isVideo, status: "error", progress: 0, errorMsg: err });
      } else {
        newItems.push({ id, file, preview, isVideo, status: "idle", progress: 0 });
        if (isVideo) currentCounts.videos += 1;
        else currentCounts.photos += 1;
      }
    }

    setFiles((prev) => [...prev, ...newItems]);

    // Start uploading valid files immediately
    newItems
      .filter((item) => item.status === "idle")
      .forEach((item) => startUpload(item.id, item.file));
  }

  // â”€â”€ Upload a file â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function startUpload(id: string, file: File) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "uploading", progress: 0 } : f))
    );

    try {
      const key = await uploadToR2(file, (pct) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: pct } : f))
        );
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "done", progress: 100, r2Key: key } : f
        )
      );
    } catch (err: unknown) {
      const msg = friendlyApiError(err, "We couldn't upload that file.");
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "error", errorMsg: msg } : f))
      );
    }
  }

  // â”€â”€ Retry a failed upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function retryUpload(id: string) {
    const item = files.find((f) => f.id === id);
    if (!item) return;
    startUpload(id, item.file);
  }

  // â”€â”€ Remove a file â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function removeFile(id: string) {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  // â”€â”€ Drag and drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  // â”€â”€ Submit â€” confirm keys to backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleSubmit() {
    const keys = files.filter((f) => f.status === "done" && f.r2Key).map((f) => f.r2Key!);
    if (keys.length === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("bf_token");
      const res = await fetch(`${API}/api/media/confirm-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mediaKeys: keys }),
      });

      if (!res.ok) {
        const err = await res.json();
        setGlobalError(
          friendlyApiMessage(
            err.message,
            "We couldn't save your media right now.",
          ),
        );
        setSubmitting(false);
        return;
      }

      onNext(keys);
    } catch {
      setGlobalError("Network error. Please check your connection.");
      setSubmitting(false);
    }
  }

  const slots = maxFiles;
  const emptySlots = Math.max(0, slots - files.length);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest">
            Step 9 of 9
          </span>
          <span className="text-xs text-[#94A3B8]">Almost there!</span>
        </div>
        <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A] rounded-full w-full transition-all duration-500" />
        </div>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-1.5">Add your photos & videos</h2>
        <p className="text-[#64748B] text-sm leading-relaxed">
          Show your personality. Upload up to {quota.photos} photos and {quota.videos} videos â€” good lighting goes a long way ðŸ˜„
        </p>
      </div>

      {/* Limits info */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl px-3 py-2">
          <span className="text-base">ðŸ–¼ï¸</span>
          <span className="text-xs text-[#64748B]">Images up to <strong className="text-[#334155]">{MAX_IMAGE_MB} MB</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl px-3 py-2">
          <span className="text-base">ðŸŽ¬</span>
          <span className="text-xs text-[#64748B]">Videos up to <strong className="text-[#334155]">{MAX_VIDEO_MB} MB</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl px-3 py-2">
          <span className="text-base">ðŸ“</span>
          <span className="text-xs text-[#64748B]">Max <strong className="text-[#334155]">{maxFiles} files</strong></span>
        </div>
      </div>

      {/* Drop zone + grid */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="grid grid-cols-3 gap-3 mb-2"
      >
        {/* Existing files */}
        {files.map((item) => (
          <div key={item.id} className="relative">
            <MediaCard
              item={item}
              onRemove={() => removeFile(item.id)}
            />
            {/* Retry button for errors */}
            {item.status === "error" && item.errorMsg && !item.errorMsg.includes("not allowed") && !item.errorMsg.includes("under") && (
              <button
                type="button"
                onClick={() => retryUpload(item.id)}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-white text-[#1E3A8A] rounded-full px-2.5 py-1 shadow border border-[#E2E8F0] hover:bg-[#EFF6FF] transition"
              >
                Retry
              </button>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot
            key={`empty-${i}`}
            isFirst={files.length === 0 && i === 0}
            onClick={() => inputRef.current?.click()}
          />
        ))}
      </div>

      {/* Drag hint */}
      {files.length === 0 && (
        <p className="text-center text-xs text-[#94A3B8] mb-4">
          or drag and drop files anywhere above
        </p>
      )}

      {/* Upload count */}
      {files.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            {files.map((f) => (
              <div
                key={f.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  f.status === "done"
                    ? "bg-emerald-500"
                    : f.status === "uploading"
                    ? "bg-[#3B82F6] animate-pulse"
                    : f.status === "error"
                    ? "bg-red-400"
                    : "bg-[#E2E8F0]"
                }`}
                style={{ minWidth: "24px" }}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-[#E2E8F0]" style={{ minWidth: "24px" }} />
            ))}
          </div>
          <span className="text-xs text-[#64748B] shrink-0">
            {doneCount}/{maxFiles} uploaded
          </span>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 shrink-0 mt-0.5">âš </span>
          <p className="text-red-700 text-sm">{globalError}</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={handleFilePick}
      />

      {/* Buttons */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-none rounded-xl border-2 border-[#E2E8F0] bg-white text-[#334155] font-semibold py-3.5 px-5 text-sm hover:bg-[#F8FAFF] hover:border-[#93C5FD] transition"
        >
          â† Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue || submitting}
          className="flex-1 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Savingâ€¦
            </span>
          ) : hasUploading ? (
            "Uploadingâ€¦ please wait"
          ) : doneCount === 0 ? (
            "Upload at least 1 photo to continue"
          ) : (
            `Continue with ${doneCount} file${doneCount > 1 ? "s" : ""} â†’`
          )}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-[#94A3B8]">
        You can add or change your media later from your profile settings.
      </p>
    </div>
  );
}

