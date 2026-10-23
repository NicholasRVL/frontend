const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "available", label: "Tersedia" },
  { id: "reserved", label: "Dipesan" },
  { id: "occupied", label: "Terisi" },
];

export default function MapFilters({ value, onChange }) {
  return (
    <div className="map-filters" role="group" aria-label="Filter status slot">
      {FILTERS.map((filter) => (
        <button
          aria-pressed={value === filter.id}
          className={value === filter.id ? "is-active" : ""}
          key={filter.id}
          onClick={() => onChange(filter.id)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
