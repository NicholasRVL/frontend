import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MapFilters from "../components/parking/MapFilters";
import ParkingMap from "../components/parking/ParkingMap";
import { parkingService } from "../services/parkingService";

export default function PublicParking() {
  const location = useLocation();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function loadPublicSlots() {
      try {
        const publicSlots = await parkingService.publicSlots();
        setSlots(publicSlots);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(loadError.message || "Denah parkir gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }
    loadPublicSlots();
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const publicSlots = await parkingService.publicSlots();
      setSlots(publicSlots);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError.message || "Denah parkir gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => slots.reduce((result, slot) => {
    result[slot.status] += 1;
    return result;
  }, { available: 0, reserved: 0, occupied: 0 }), [slots]);

  return (
    <div className="public-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span><strong>COVENTOWN</strong><small>Parking</small></span>
        </Link>
        <nav aria-label="Navigasi utama">
          <Link className="active" to="/">Parkir</Link>
          <Link to="/login"></Link>
        </nav>
      </header>

      <main className="public-main">
        {location.state?.notice && (
          <div className="dashboard-notice public-notice" role="status">{location.state.notice}</div>
        )}
        <div className="page-heading">
          <div>
            <p className="eyebrow">COVENTOWN PARKING</p>
            <h1>Denah parkir langsung</h1>
            <p>Status slot parkir terkini. Informasi pelanggan hanya tersedia bagi petugas yang berwenang.</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading}>
            {loading ? "Memuat..." : "Segarkan data"}
          </button>
        </div>

        <div className="metrics public-metrics">
          <Metric label="Total slot" value={slots.length} status="total" />
          <Metric label="Tersedia" value={counts.available} status="available" />
          <Metric label="Dipesan" value={counts.reserved} status="reserved" />
          <Metric label="Terisi" value={counts.occupied} status="occupied" />
        </div>

        <section className="public-map-card" aria-labelledby="slot-map-heading">
          <div className="section-heading">
            <div>
              <h2 id="slot-map-heading">Peta parkir langsung</h2>
              <p>
                {lastUpdated
                  ? `Terakhir diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}`
                  : "Data dibaca langsung dari API publik."}
              </p>
            </div>
            <MapFilters value={filter} onChange={setFilter} />
          </div>

          {error && (
            <div className="form-error public-error" role="alert">
              {error}
              <button className="btn btn-secondary" type="button" onClick={refresh}>Coba lagi</button>
            </div>
          )}
          {loading && slots.length === 0 && <p className="empty-state" role="status">Memuat status slot...</p>}
          {!loading && !error && slots.length === 0 && (
            <p className="map-empty-notice">Belum ada status slot dari server; posisi yang belum terkonfirmasi ditandai abu-abu.</p>
          )}
          <ParkingMap
            filter={filter}
            onClose={() => setSelected(null)}
            onSelect={setSelected}
            role="public"
            selected={selected}
            slots={slots}
            updatedAt={lastUpdated}
          />
          {loading && slots.length > 0 && <p className="refreshing-note">Memperbarui data...</p>}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, status }) {
  return (
    <div className="metric">
      <div className={`metric-icon metric-${status}`} aria-hidden="true" />
      <div><p>{label}</p><strong>{value}</strong></div>
    </div>
  );
}
