const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://coventown-parkir-api-delta.vercel.app/api";

const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function responseMessage(status, payload) {
  if (status === 401) return "Sesi berakhir atau username/PIN salah.";
  if (status === 403) return "Akun tidak memiliki izin untuk tindakan ini.";
  if (status === 404) return "Data atau halaman yang diminta tidak ditemukan.";
  if (status === 409) return "Data baru saja berubah atau slot sedang terkunci.";
  if (status === 422) {
    const validationMessages = Object.values(payload?.errors || {}).flat();
    return validationMessages[0] || payload?.message || "Periksa kembali data yang dimasukkan.";
  }
  if (status >= 500) return "Server sedang bermasalah. Coba lagi beberapa saat.";
  return payload?.message || `Permintaan gagal (${status}).`;
}

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError("API tidak merespons tepat waktu. Coba lagi.");
    }
    throw new ApiError("Tidak dapat terhubung ke API. Periksa koneksi internet.");
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new ApiError("API mengembalikan respons yang tidak valid.", response.status);
      }
    }
  }

  if (!response.ok) {
    const error = new ApiError(
      responseMessage(response.status, payload),
      response.status,
      payload,
    );
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event("coventown:unauthorized"));
    }
    throw error;
  }

  return payload;
}

export const apiRequest = request;
export { API_BASE_URL };
