import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Halaman tidak ditemukan</h1>
      <Link className="btn btn-primary" to="/">Kembali ke denah parkir</Link>
    </main>
  );
}
