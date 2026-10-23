const STATUS_LABELS = {
  available: "Tersedia",
  reserved: "Dipesan",
  occupied: "Terisi",
  unknown: "Status belum diketahui",
};

export default function SlotDetailPanel({ slot, referenceCode, updatedAt, role, onClose, onChangeStatus }) {
  if (!slot) return null;

  return (
    <aside className="map-detail-panel" aria-labelledby="slot-detail-title">
      <div className="map-detail-heading">
        <div>
          <p className="map-detail-eyebrow">DETAIL SLOT</p>
          <h3 id="slot-detail-title">{slot.id}</h3>
        </div>
        <button
          aria-label="Tutup detail slot"
          className="map-detail-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      <dl className="map-detail-list">
        <div>
          <dt>Kode slot</dt>
          <dd>{slot.id}</dd>
        </div>
        {referenceCode && (
          <div>
            <dt>Posisi denah</dt>
            <dd>{referenceCode}</dd>
          </div>
        )}
        <div>
          <dt>Status</dt>
          <dd><span className={`map-status-text status-${slot.status}`}>{STATUS_LABELS[slot.status]}</span></dd>
        </div>
        {slot.locked && (
          <div>
            <dt>Informasi</dt>
            <dd>Terkunci oleh reservasi aktif</dd>
          </div>
        )}
        {updatedAt && (
          <div>
            <dt>Data diperbarui</dt>
            <dd>{updatedAt.toLocaleTimeString("id-ID")}</dd>
          </div>
        )}
      </dl>
      {role === "satpam" && slot.status !== "unknown" && (
        <div className="map-detail-actions">
          <button
            className="map-action-occupied"
            disabled={slot.locked || slot.status === "occupied"}
            onClick={() => onChangeStatus(slot, "occupied")}
            type="button"
          >
            Tandai terisi
          </button>
          <button
            className="map-action-empty"
            disabled={slot.locked || slot.status === "available"}
            onClick={() => onChangeStatus(slot, "empty")}
            type="button"
          >
            Tandai tersedia
          </button>
        </div>
      )}
    </aside>
  );
}
