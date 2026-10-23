import { useMemo } from "react";
import {
  PARKING_LAYOUT,
  PARKING_MAP_VIEWBOX,
  SLOT_POSITION_BY_CODE,
} from "./parkingLayout";
import ParkingLegend from "./ParkingLegend";
import SlotDetailPanel from "./SlotDetailPanel";

const STATUS_LABELS = {
  available: "Tersedia",
  reserved: "Dipesan",
  occupied: "Terisi",
  unknown: "Belum diketahui",
};

function MapSlot({ position, slot, selected, dimmed, onSelect }) {
  const status = slot?.status ?? "unknown";
  const transform = position.rotation
    ? `rotate(${position.rotation} ${position.x} ${position.y})`
    : undefined;

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(slot || { id: position.code, status: "unknown", isUnmapped: false });
    }
  }

  return (
    <g transform={transform}>
      <g
        aria-label={`${slot?.id ?? position.code}, ${STATUS_LABELS[status]}${position.referenceCode ? `, posisi ${position.referenceCode}` : ""}`}
        className={[
          "map-slot",
          `map-slot-${status}`,
          selected ? "is-selected" : "",
          dimmed && !selected ? "is-dimmed" : "",
        ].filter(Boolean).join(" ")}
        onClick={() => onSelect(slot || { id: position.code, status: "unknown", isUnmapped: false })}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <title>{`${slot?.id ?? position.code} · ${STATUS_LABELS[status]}${position.referenceCode ? ` · posisi ${position.referenceCode}` : ""}`}</title>
        <rect
          className="map-slot-shape"
          height={position.height}
          rx="3"
          width={position.width}
          x={position.x - position.width / 2}
          y={position.y - position.height / 2}
        />
        <text className="map-slot-code" textAnchor="middle" x={position.x} y={position.y - 2}>
          {slot?.id ?? position.code}
        </text>
        <text className="map-slot-reference" textAnchor="middle" x={position.x} y={position.y + 9}>
          {position.referenceCode}
        </text>
        <text className="map-slot-status" textAnchor="middle" x={position.x} y={position.y + 20}>
          {STATUS_LABELS[status]}
        </text>
      </g>
    </g>
  );
}

export default function ParkingMap({
  slots,
  selected,
  filter,
  updatedAt,
  role,
  onSelect,
  onClose,
  onChangeStatus,
}) {
  const { slotsByCode, unplacedSlots, counts, unknownCount } = useMemo(() => {
    const byCode = new Map(slots.map((slot) => [slot.id, slot]));
    return {
      slotsByCode: byCode,
      unplacedSlots: slots.filter((slot) => !SLOT_POSITION_BY_CODE.has(slot.id)),
      counts: slots.reduce((result, slot) => {
        result[slot.status] += 1;
        return result;
      }, { available: 0, reserved: 0, occupied: 0 }),
      unknownCount: PARKING_LAYOUT.filter((position) => !byCode.has(position.code)).length,
    };
  }, [slots]);

  const selectedSlot = selected
    ? slotsByCode.get(selected.id)
      ?? (SLOT_POSITION_BY_CODE.has(selected.id)
        ? { id: selected.id, status: "unknown" }
        : null)
    : null;

  return (
    <div className={`parking-map-layout ${selectedSlot ? "has-selection" : ""}`}>
      <ParkingLegend counts={counts} unknownCount={unknownCount} />
      <div className="parking-map-scroll" tabIndex={0} aria-label="Denah parkir, geser horizontal untuk melihat seluruh area">
        <svg
          aria-label="Denah parkir Coventown"
          className="parking-map-svg"
          role="group"
          viewBox={PARKING_MAP_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern height="28" id="parking-grid" patternUnits="userSpaceOnUse" width="28">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#fffaf1" strokeWidth="1" />
            </pattern>
            <pattern height="12" id="road-markings" patternUnits="userSpaceOnUse" width="22">
              <path d="M 0 6 H 12" stroke="#baa995" strokeDasharray="5 5" strokeWidth="1" />
            </pattern>
          </defs>

          <rect className="map-ground" height="590" width="1200" />
          <rect height="590" width="1200" fill="url(#parking-grid)" />

          <path className="map-lane-edge" d="M 280 225 V 480 H 930 V 270" />
          <path className="map-lane-edge" d="M 235 280 H 285" />
          <path className="map-lane-center" d="M 285 288 V 475 H 920 V 275" />
          <path className="map-lane-center" d="M 250 275 H 285" />
          <rect fill="url(#road-markings)" height="26" width="630" x="290" y="268" />
          <text className="map-road-label" textAnchor="middle" x="605" y="263">JALUR KENDARAAN</text>

          <path className="map-building" d="M 0 0 H 1200 V 98 H 0 Z" />
          <path className="map-building-edge" d="M 0 97 H 1200" />
          <text className="map-brand-name" textAnchor="middle" x="600" y="53">COVENTOWN</text>
          <text className="map-building-caption" textAnchor="middle" x="600" y="73">RESTAURANT &amp; PARKING</text>

          <path className="map-entry" d="M 420 98 H 780 L 748 125 H 452 Z" />
          <text className="map-entry-label" textAnchor="middle" x="600" y="116">PINTU RESTORAN</text>
          <path className="map-entry-walk" d="M 600 125 V 185" />

          {PARKING_LAYOUT.map((position) => (
            <MapSlot
              dimmed={filter !== "all" && slotsByCode.get(position.code)?.status !== filter}
              key={position.code}
              onSelect={onSelect}
              position={position}
              selected={selectedSlot?.id === position.code}
              slot={slotsByCode.get(position.code)}
            />
          ))}

          <g className="map-guard-post">
            <rect height="58" rx="2" width="260" x="470" y="520" />
            <text className="map-guard-title" textAnchor="middle" x="600" y="545">POS SATPAM</text>
            <text className="map-guard-caption" textAnchor="middle" x="600" y="561">24 JAM</text>
          </g>
          <path className="map-exit-path" d="M 970 535 H 1030" />
          <path className="map-exit-arrow" d="m 1020 528 10 7-10 7" />
          <text className="map-exit-label" textAnchor="middle" x="992" y="520">KELUAR</text>

          {unplacedSlots.length > 0 && (
            <g aria-hidden="true" className="map-unplaced-hint">
              <text x="30" y="575">{unplacedSlots.length} slot API belum punya posisi pada denah</text>
            </g>
          )}
        </svg>
      </div>

      <p className="map-pan-hint">Geser denah ke samping untuk melihat seluruh area parkir.</p>

      {unplacedSlots.length > 0 && (
        <section className="unplaced-slots" aria-labelledby="unplaced-slots-title">
          <h3 id="unplaced-slots-title">Slot tanpa posisi pada denah</h3>
          <p>Kode ini ada di API tetapi belum memiliki koordinat layout.</p>
          <div>
            {unplacedSlots.map((slot) => (
              <button
                aria-pressed={selectedSlot?.id === slot.id}
                className={`unplaced-slot status-${slot.status}${filter !== "all" && slot.status !== filter ? " is-dimmed" : ""}`}
                key={slot.id}
                onClick={() => onSelect({ ...slot, isUnmapped: true })}
                type="button"
              >
                <strong>{slot.id}</strong>
                <span>{STATUS_LABELS[slot.status]}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <SlotDetailPanel
        onChangeStatus={onChangeStatus}
        onClose={onClose}
        referenceCode={SLOT_POSITION_BY_CODE.get(selectedSlot?.id)?.referenceCode}
        role={role}
        slot={selectedSlot}
        updatedAt={updatedAt}
      />
    </div>
  );
}
