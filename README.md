# Coventown Parking

Frontend React/Vite for the Coventown Parking Management System.

## Menjalankan aplikasi

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` ke base URL API Laravel, misalnya:

```dotenv
VITE_API_BASE_URL=https://coventown-parkir-api-delta.vercel.app/api
```

Pengunjung dapat membuka denah publik di `/` tanpa login. Petugas admin dan satpam masuk melalui `/login`; halaman terlindungi memverifikasi profil melalui API sebelum menampilkan dashboard. Hak akses API tetap ditegakkan oleh backend.

## Pemeriksaan

```sh
npm run lint
npm run build
```

Kontrak endpoint, akses role, bentuk payload/respons, dan pemetaan data dijelaskan di [docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md).
