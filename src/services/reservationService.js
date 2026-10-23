import { apiRequest, ApiError } from "./api";

function asArray(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(rows)) {
    throw new ApiError("Format data reservasi dari API tidak sesuai.");
  }
  return rows;
}

function normalizeReservation(item) {
  if (item?.id === undefined || !item?.customer_name || !item?.plate || !item?.arrival_time) {
    throw new ApiError("Data reservasi dari API tidak lengkap.");
  }

  return {
    id: String(item.id),
    customerName: item.customer_name,
    plate: item.plate,
    arrivalTime: item.arrival_time,
    hasParking: Boolean(item.has_parking),
    slotCode: item.slot_code ?? item.slot?.code ?? null,
  };
}

export const reservationService = {
  async list(token, date) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return asArray(await apiRequest(`/reservations${query}`, { token }))
      .map(normalizeReservation);
  },
  create(token, reservation) {
    return apiRequest("/reservations", {
      method: "POST",
      token,
      body: JSON.stringify(reservation),
    });
  },
  update(token, id, reservation) {
    return apiRequest(`/reservations/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      token,
      body: JSON.stringify(reservation),
    });
  },
  remove(token, id) {
    return apiRequest(`/reservations/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      token,
    });
  },
};
