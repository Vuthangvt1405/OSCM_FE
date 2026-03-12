export interface MediaUploadResponse {
  url: string;
}

export interface MediaUploadError {
  error: string;
}

/**
 * Upload a media file to the server
 * @param file - The file to upload
 * @returns The server URL of the uploaded file
 */
export async function uploadMedia(file: File): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/social/media/upload", {
    method: "POST",
    body: formData,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? String(payload.error)
        : `Upload failed (${res.status})`;
    throw new Error(errorMessage);
  }

  return payload as MediaUploadResponse;
}
