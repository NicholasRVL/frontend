import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapFilters from "../components/parking/MapFilters";
import ParkingMap from "../components/parking/ParkingMap";
import { useAuth } from "../contexts/useAuth";
import { parkingService } from "../services/parkingService";
import { reservationService } from "../services/reservationService";
import { userService } from "../services/userService";

function today() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function initialReservation() {
  const start = new Date(Date.now() + 60_000);
  const localStart = new Date(start.getTime() - start.getTimezoneOffset() * 60_000);
  return {
    customer_name: "",
    plate: "",
    date: localStart.toISOString().slice(0, 10),
    time: localStart.toISOString().slice(11, 16),
  };
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-heading">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      {children}
    </div>
  );
}

export default function ParkingView() {
  const { token, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const [page, setPage] = useState("overview");
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reservationDraft, setReservationDraft] = useState(null);
  const [userDraft, setUserDraft] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mapFilter, setMapFilter] = useState("all");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadSlots = useCallback(async () => {
    const result = await parkingService.slots(token);
    setSlots(result);
    setUpdatedAt(new Date());
  }, [token]);

  const loadReservations = useCallback(async () => {
    if (!isAdmin) return;
    setReservations(await reservationService.list(token, date));
  }, [date, isAdmin, token]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsers(await userService.list(token));
  }, [isAdmin, token]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const tasks = [loadSlots()];
      if (page === "reservations" && isAdmin) tasks.push(loadReservations());
      if (page === "users" && isAdmin) tasks.push(loadUsers());
      await Promise.all(tasks);
    } catch (loadError) {
      setError(loadError.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadReservations, loadSlots, loadUsers, page]);

  useEffect(() => {
    async function loadInitialSlots() {
      try {
        await loadSlots();
      } catch (loadError) {
        setError(loadError.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (page !== "reservations" || !isAdmin) return;
    async function loadReservationPage() {
      try {
        await loadReservations();
      } catch (loadError) {
        setError(loadError.message || "Gagal memuat reservasi.");
      } finally {
        setLoading(false);
      }
    }
    loadReservationPage();
  }, [isAdmin, loadReservations, page]);

  useEffect(() => {
    if (page !== "users" || !isAdmin) return;
    async function loadUserPage() {
      try {
        await loadUsers();
      } catch (loadError) {
        setError(loadError.message || "Gagal memuat pengguna.");
      } finally {
        setLoading(false);
      }
    }
    loadUserPage();
  }, [isAdmin, loadUsers, page]);

  const counts = useMemo(() => slots.reduce((result, slot) => {
    result[slot.status] += 1;
    return result;
  }, { available: 0, reserved: 0, occupied: 0 }), [slots]);

  async function changeStatus(slot, status) {
    setError("");
    setNotice("");
    try {
      await parkingService.updateStatus(token, slot.rawId, status === "occupied" ? "occupied" : "empty");
      await loadSlots();
      setNotice(`Status slot ${slot.id} berhasil diperbarui.`);
    } catch (updateError) {
      if (updateError.status === 409) {
        try {
          await loadSlots();
        } catch (refreshError) {
          setError(refreshError.message || updateError.message);
          return;
        }
      }
      setError(updateError.message || "Gagal memperbarui status slot.");
    }
  }

  async function saveReservation(event) {
    event.preventDefault();
    if (!reservationDraft) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { id, customer_name, plate, date: arrivalDate, time } = reservationDraft;
    const payload = {
      customer_name: customer_name.trim(),
      plate: plate.trim().toUpperCase(),
      arrival_time: `${arrivalDate}T${time}:00`,
    };
    try {
      if (id) await reservationService.update(token, id, payload);
      else await reservationService.create(token, payload);
      setReservationDraft(null);
      await Promise.all([loadReservations(), loadSlots()]);
      setNotice(id ? "Reservasi berhasil diperbarui." : "Reservasi berhasil dibuat.");
    } catch (saveError) {
      setError(saveError.message || "Gagal menyimpan reservasi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReservation(id) {
    if (!window.confirm("Batalkan reservasi ini?")) return;
    setError("");
    try {
      await reservationService.remove(token, id);
      await Promise.all([loadReservations(), loadSlots()]);
      setNotice("Reservasi berhasil dibatalkan.");
    } catch (deleteError) {
      setError(deleteError.message || "Gagal membatalkan reservasi.");
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    if (!userDraft) return;
    setSaving(true);
    setError("");
    setNotice("");
    const { id, username, pin, role: userRole } = userDraft;
    try {
      if (id) {
        const update = { username: username.trim(), role: userRole };
        if (pin) update.pin = pin;
        await userService.update(token, id, update);
      } else {
        await userService.create(token, {
          username: username.trim(),
          pin,
          role: userRole,
        });
      }
      setUserDraft(null);
      await loadUsers();
      setNotice(id ? "Akun berhasil diperbarui." : "Akun berhasil dibuat.");
    } catch (saveError) {
      setError(saveError.message || "Gagal menyimpan akun.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(userItem) {
    setError("");
    try {
      await userService.update(token, userItem.id, { is_active: !userItem.isActive });
      await loadUsers();
      setNotice(`Akun ${userItem.username} berhasil diperbarui.`);
    } catch (updateError) {
      setError(updateError.message || "Gagal memperbarui akun.");
    }
  }

  async function deleteUser(userItem) {
    if (!window.confirm(`Hapus akun ${userItem.username}?`)) return;
    setError("");
    try {
      await userService.remove(token, userItem.id);
      await loadUsers();
      setNotice(`Akun ${userItem.username} berhasil dihapus.`);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus akun.");
    }
  }

  async function signOut() {
    try {
      await logout();
      navigate("/", { replace: true, state: { notice: "Anda telah keluar." } });
    } catch {
      navigate("/", {
        replace: true,
        state: { notice: "Sesi lokal telah dihapus, tetapi server gagal memproses logout." },
      });
    }
  }

  const navItems = [
    { id: "overview", label: "Ringkasan" },
    { id: "slots", label: "Peta Parkir" },
    ...(isAdmin
      ? [{ id: "reservations", label: "Reservasi" }, { id: "users", label: "Pengguna" }]
      : []),
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span><strong>COVENTOWN</strong><small>Parking management</small></span>
        </Link>
        <nav aria-label="Navigasi dashboard">
          {navItems.map((item) => (
            <button
              className={page === item.id ? "active" : ""}
              key={item.id}
              onClick={() => {
                setLoading(item.id === "reservations" || item.id === "users");
                setPage(item.id);
                setError("");
                setNotice("");
              }}
              type="button"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>HAK AKSES</span>
          <strong>{isAdmin ? "Administrator" : "Satpam"}</strong>
          <p>{isAdmin ? "Manajemen reservasi dan akun." : "Operasional status slot parkir."}</p>
        </div>
        <button className="support-link" type="button" onClick={refresh}>
          <span>Segarkan data</span>
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="venue-context"><span>LOKASI AKTIF</span><strong>Coventown Parking</strong></div>
          <div className="top-actions">
            <div className="profile">
              <div className="avatar">{user?.username?.slice(0, 2).toUpperCase()}</div>
              <div><strong>{user?.username}</strong><span>{isAdmin ? "Administrator" : "Satpam"}</span></div>
              <button className="btn btn-secondary" type="button" onClick={signOut}>Keluar</button>
            </div>
          </div>
        </header>

        <main>
          {error && <div className="form-error api-error" role="alert">{error}</div>}
          {notice && <div className="dashboard-notice" role="status">{notice}</div>}
          {loading && <p className="loading-line" role="status">Memuat data dari API...</p>}

          {page === "overview" && (
            <>
              <PageHeader
                title="Ringkasan parkir"
                subtitle={`${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Data langsung dari server`}
              >
                <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading}>Segarkan</button>
              </PageHeader>
              <div className="metrics">
                <Metric label="Total slot" value={slots.length} status="total" />
                <Metric label="Tersedia" value={counts.available} status="available" />
                <Metric label="Dipesan" value={counts.reserved} status="reserved" />
                <Metric label="Terisi" value={counts.occupied} status="occupied" />
              </div>
              <section>
                <div className="section-heading">
                  <div><h2>Peta parkir langsung</h2><p>Status slot operasional dari API Coventown.</p></div>
                  <button className="text-link" type="button" onClick={() => setPage("slots")}>Buka peta →</button>
                </div>
                <ParkingControls filter={mapFilter} onChangeFilter={setMapFilter} />
                <ParkingMap
                  filter={mapFilter}
                  onChangeStatus={changeStatus}
                  onClose={() => setSelectedSlot(null)}
                  onSelect={setSelectedSlot}
                  role={role}
                  selected={selectedSlot}
                  slots={slots}
                  updatedAt={updatedAt}
                />
              </section>
            </>
          )}

          {page === "slots" && (
            <>
              <PageHeader
                title="Peta parkir"
                subtitle={isAdmin ? "Pantau status seluruh slot parkir." : "Perbarui status slot sesuai kondisi operasional."}
              >
                <div className="map-page-actions">
                  <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading}>Segarkan</button>
                  <Link className="btn btn-secondary" to="/">Denah publik</Link>
                </div>
              </PageHeader>
              <ParkingControls filter={mapFilter} onChangeFilter={setMapFilter} />
              <ParkingMap
                filter={mapFilter}
                onChangeStatus={changeStatus}
                onClose={() => setSelectedSlot(null)}
                onSelect={setSelectedSlot}
                role={role}
                selected={selectedSlot}
                slots={slots}
                updatedAt={updatedAt}
              />
            </>
          )}

          {page === "reservations" && isAdmin && (
            <ReservationsPanel
              date={date}
              onDateChange={(nextDate) => { setLoading(true); setDate(nextDate); }}
              reservations={reservations}
              draft={reservationDraft}
              onDraft={setReservationDraft}
              onSave={saveReservation}
              onDelete={deleteReservation}
              saving={saving}
            />
          )}

          {page === "users" && isAdmin && (
            <UsersPanel
              users={users}
              draft={userDraft}
              onDraft={setUserDraft}
              onSave={saveUser}
              onToggle={toggleUser}
              onDelete={deleteUser}
              saving={saving}
            />
          )}
        </main>
      </div>
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

function ParkingControls({ filter, onChangeFilter }) {
  return (
    <div className="parking-map-toolbar">
      <MapFilters value={filter} onChange={onChangeFilter} />
    </div>
  );
}

function ReservationsPanel({ date, onDateChange, reservations, draft, onDraft, onSave, onDelete, saving }) {
  function edit(item) {
    onDraft({
      id: item.id,
      customer_name: item.customerName,
      plate: item.plate,
      date: item.arrivalTime.slice(0, 10),
      time: item.arrivalTime.slice(11, 16),
    });
  }

  return (
    <>
      <PageHeader title="Reservasi" subtitle="Kelola reservasi dan waktu kedatangan." >
        <button className="btn btn-primary" type="button" onClick={() => onDraft(initialReservation())}>
          Reservasi baru
        </button>
      </PageHeader>
      <div className="table-card">
        <div className="table-tools">
          <strong>Daftar reservasi</strong>
          <label className="compact-field">
            Tanggal
            <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Pelanggan</th><th>Plat</th><th>Waktu datang</th><th>Slot</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {reservations.map((item) => (
                <tr key={item.id}>
                  <td>{item.customerName}</td>
                  <td><span className="plate">{item.plate}</span></td>
                  <td>{new Date(item.arrivalTime).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>{item.slotCode || (item.hasParking ? "Ditentukan API" : "Belum tersedia")}</td>
                  <td>{item.hasParking ? "Slot ditetapkan" : "Menunggu slot"}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => edit(item)}>Ubah</button>
                    <button className="btn btn-danger" type="button" onClick={() => onDelete(item.id)}>Batalkan</button>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && <tr><td colSpan="6">Tidak ada reservasi pada tanggal ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {draft && (
        <section className="editor-card">
          <h2>{draft.id ? "Ubah reservasi" : "Reservasi baru"}</h2>
          <form className="form-grid" onSubmit={onSave}>
            <label className="span-2">Nama pelanggan
              <input required maxLength="100" value={draft.customer_name} onChange={(event) => onDraft({ ...draft, customer_name: event.target.value })} />
            </label>
            <label>Plat kendaraan
              <input required maxLength="20" value={draft.plate} onChange={(event) => onDraft({ ...draft, plate: event.target.value.toUpperCase() })} />
            </label>
            <label>Tanggal datang
              <input type="date" required value={draft.date} onChange={(event) => onDraft({ ...draft, date: event.target.value })} />
            </label>
            <label>Waktu datang
              <input type="time" required value={draft.time} onChange={(event) => onDraft({ ...draft, time: event.target.value })} />
            </label>
            <div className="editor-actions">
              <button className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => onDraft(null)}>Batal</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function UsersPanel({ users, draft, onDraft, onSave, onToggle, onDelete, saving }) {
  return (
    <>
      <PageHeader title="Pengguna" subtitle="Kelola akun admin dan satpam." >
        <button className="btn btn-primary" type="button" onClick={() => onDraft({ username: "", pin: "", role: "satpam" })}>
          Tambah pengguna
        </button>
      </PageHeader>
      <div className="table-card table-scroll">
        <table>
          <thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id}>
                <td>{userItem.username}</td>
                <td>{userItem.role}</td>
                <td>{userItem.isActive ? "Aktif" : "Nonaktif"}</td>
                <td className="row-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => onDraft({ id: userItem.id, username: userItem.username, pin: "", role: userItem.role })}>Ubah</button>
                  <button className="btn btn-secondary" type="button" onClick={() => onToggle(userItem)}>{userItem.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                  <button className="btn btn-danger" type="button" onClick={() => onDelete(userItem)}>Hapus</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4">Belum ada pengguna.</td></tr>}
          </tbody>
        </table>
      </div>
      {draft && (
        <section className="editor-card">
          <h2>{draft.id ? "Ubah pengguna" : "Pengguna baru"}</h2>
          <form className="form-grid" onSubmit={onSave}>
            <label>Username
              <input required minLength="3" maxLength="20" value={draft.username} onChange={(event) => onDraft({ ...draft, username: event.target.value })} />
            </label>
            <label>Role
              <select value={draft.role} onChange={(event) => onDraft({ ...draft, role: event.target.value })}>
                <option value="admin">Admin</option>
                <option value="satpam">Satpam</option>
              </select>
            </label>
            <label className="span-2">PIN {draft.id ? "(kosongkan jika tidak diubah)" : "(6 digit)"}
              <input
                required={!draft.id}
                inputMode="numeric"
                maxLength="6"
                pattern="[0-9]{6}"
                value={draft.pin}
                onChange={(event) => onDraft({ ...draft, pin: event.target.value.replace(/\D/g, "").slice(0, 6) })}
              />
            </label>
            <div className="editor-actions">
              <button className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => onDraft(null)}>Batal</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
