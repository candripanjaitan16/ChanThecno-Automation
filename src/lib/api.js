export const API_URL =
  import.meta.env.VITE_API_URL || "https://chanthecno.co-id.id/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Semua request memakai credentials: "include" agar cookie session
 * ikut terkirim (login berbasis session PHP).
 */
export async function api(path, { method = "GET", body } = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server.", 0);
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // respons bukan JSON
  }

  if (!response.ok || !data?.success) {
    throw new ApiError(
      data?.message || "Terjadi kesalahan pada server.",
      response.status,
    );
  }

  return data;
}
