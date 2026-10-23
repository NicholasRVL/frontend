const STATUSES = [
  { id: "available", label: "Tersedia" },
  { id: "reserved", label: "Dipesan" },
  { id: "occupied", label: "Terisi" },
];

export default function ParkingLegend({ counts, unknownCount = 0 }) {
  return (
    <div className="parking-map-legend" aria-label="Legenda status slot parkir">
      {STATUSES.map((status) => (
        <span key={status.id}>
          <i className={`legend-${status.id}`} />
          {status.label}
          <strong>{counts[status.id] ?? 0}</strong>
        </span>
      ))}
      {unknownCount > 0 && (
        <span>
          <i className="legend-unknown" />
          Belum diketahui
          <strong>{unknownCount}</strong>
        </span>
      )}
    </div>
  );
}
