import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function LoginPage() {
  const { user, authError, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/satpam"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const verifiedUser = await login(username.trim(), pin);
      const fallback = verifiedUser.role === "admin" ? "/admin" : "/satpam";
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath === fallback ? requestedPath : fallback, { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Login tidak berhasil. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <Link className="login-back" to="/">Kembali ke denah parkir</Link>
        <div className="brand-mark login-mark" aria-hidden="true">C</div>
        <p className="eyebrow">COVENTOWN PARKING</p>
        <h1>Masuk petugas</h1>
        <p className="login-intro">Gunakan akun admin atau satpam untuk melanjutkan.</p>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            PIN (6 digit)
            <input
              autoComplete="current-password"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </label>
          {(error || authError) && <div className="form-error" role="alert">{error || authError}</div>}
          <button className="btn btn-primary login-submit" disabled={busy}>
            {busy ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </section>
    </div>
  );
}
