import { friendlyApiMessage, friendlyApiError } from "@/lib/apiMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface UploadResult {
  key: string;
}

export class UploadStepError extends Error {
  step: "presign" | "storage" | "process";

  constructor(step: "presign" | "storage" | "process", message: string) {
    super(message);
    this.name = "UploadStepError";
    this.step = step;
  }
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

export function uploadMediaFile(
  file: File,
  scope: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scope", scope);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/api/media/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("bf_token")}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: any = null;
        try {
          data = JSON.parse(xhr.responseText || "{}");
        } catch {}

        if (xhr.status >= 200 && xhr.status < 300 && data?.key) {
          resolve({ key: data.key });
          return;
        }

        reject(
          new UploadStepError(
            "storage",
            friendlyApiMessage(
              data?.message || `Upload to storage failed (HTTP ${xhr.status})`,
              "We couldn't complete that request. Please try again.",
            ),
          ),
        );
      };

      xhr.onerror = () =>
        reject(new UploadStepError("storage", "Upload to storage failed"));

      xhr.send(formData);
    } catch (err) {
      if (err instanceof UploadStepError) {
        reject(err);
        return;
      }
      reject(new UploadStepError("storage", friendlyApiError(err, "We couldn't upload that file.")));
    }
  });
}
