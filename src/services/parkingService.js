import { apiRequest, ApiError } from "./api";

function asArray(payload, name) {
  const rows = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(rows)) {
    throw new ApiError(`Format data ${name} dari API tidak sesuai.`);
  }
  return rows;
}

const statusMap = {
  empty: "available",
  available: "available",
  booked: "reserved",
  reserved: "reserved",
  occupied: "occupied",
};

function normalizeSlot(slot, includePrivateFields) {
  const id = slot?.code ?? slot?.slot_code ?? slot?.name;
  const status = statusMap[String(slot?.status || "").toLowerCase()];
  if (id === undefined || !status) {
    throw new ApiError("Data slot dari API tidak memiliki kode atau status yang valid.");
  }

  const normalized = { id: String(id), status };
  if (includePrivateFields) {
    normalized.rawId = slot.id;
    normalized.locked = Boolean(slot.locked);
  }
  return normalized;
}

export const parkingService = {
  async publicSlots() {
    const payload = await apiRequest("/public/slots");
    return asArray(payload, "slot publik").map((slot) => normalizeSlot(slot, false));
  },
  async slots(token) {
    const payload = await apiRequest("/slots", { token });
    return asArray(payload, "slot").map((slot) => normalizeSlot(slot, true));
  },
  updateStatus(token, id, status) {
    return apiRequest(`/slots/${encodeURIComponent(String(id))}/status`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status }),
    });
  },
};
