# Coventown Parking API integration

## Verification source

The API contract below was checked against the Laravel repository's `routes/api.php`, controllers, and `App\Models\Slot` at the repository's default branch during this implementation. The route table and controller code are the authoritative sources; no scanner or QR endpoint is defined there.

- [API routes](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/routes/api.php)
- [AuthController](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Http/Controllers/AuthController.php)
- [PublicSlotController](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Http/Controllers/PublicSlotController.php)
- [SlotController](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Http/Controllers/SlotController.php)
- [ReservationController](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Http/Controllers/ReservationController.php)
- [UserController](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Http/Controllers/UserController.php)
- [Slot model](https://github.com/Abangshidiq/coventown-parkir-api/blob/44e2bc295a551a280442e6d5554427021adb88f1/app/Models/Slot.php)

## Base URL and authentication

Set `VITE_API_BASE_URL` in the frontend environment. `.env.example` uses `https://coventown-parkir-api-delta.vercel.app/api`; the client removes a trailing `/api` before adding the API prefix, so either a host-only URL or an `/api` URL works without creating `/api/api`.

Authenticated requests use the Laravel Sanctum bearer token:

```http
Authorization: Bearer <token>
```

The backend issues a plain-text token from login and revokes the current device's token on logout. It does not use an HttpOnly-cookie flow in the inspected controller. The frontend keeps the token in `sessionStorage` so a page refresh retains the current browser session; this storage is accessible to JavaScript and is not protection against XSS.

## Verified endpoints

| Method and endpoint | Access | Request | Verified response / behavior |
|---|---|---|---|
| `POST /api/login` | Public; login is throttled | `{ "username": "operator", "pin": "012345" }`; PIN is a six-digit string | `{ "token": "...", "token_type": "Bearer", "user": { "id": 1, "username": "operator", "role": "admin" } }`. Invalid credentials return 401; inactive account returns 403. |
| `GET /api/me` | Authenticated admin or satpam | Bearer token | `{ "id": 1, "username": "operator", "role": "admin" }`. Used to validate identity and role before enabling protected screens. |
| `POST /api/logout` | Authenticated admin or satpam | Bearer token; no body | `{ "message": "Berhasil logout." }`; deletes the current token. |
| `GET /api/public/slots` | Public, rate-limited | None | Raw JSON array with exactly `{ "code": "P01", "status": "empty" }`-shaped objects. The live endpoint returned HTTP 200 and 18 records during validation. Status is `empty`, `booked`, or `occupied`; customer details are not included. |
| `GET /api/slots` | Authenticated `admin` or `satpam` | Bearer token | Raw JSON array of `{ "id": 1, "code": "P01", "status": "booked", "locked": true, "reservation": { "customer_name": "...", "plate": "...", "arrival_time": "..." } }`. This shape is verified from `SlotController`; reservation is null when no reservation is attached. |
| `PUT /api/slots/{slot}/status` | Authenticated `satpam` only | `{ "status": "empty" }` or `{ "status": "occupied" }` | Returns slot data in the private slot shape. A locked reservation returns 409 and is not changed. |
| `GET /api/reservations?date=YYYY-MM-DD` | Authenticated `admin` only | Optional date query in `YYYY-MM-DD` format | Raw JSON array containing `id`, `customer_name`, `plate`, `arrival_time`, `slot_code`, `has_parking`, `is_overdue`, and `created_by`. Without a date, returns active reservations; with a date, filters that day. |
| `POST /api/reservations` | Authenticated `admin` only | `{ "customer_name": "...", "plate": "AB 1234 CD", "arrival_time": "2026-10-24T10:30:00" }` | Reservation representation described above; HTTP 201. The backend assigns a slot; the request must not choose one. |
| `PUT /api/reservations/{reservation}` | Authenticated `admin` only | Partial fields from `customer_name`, `plate`, `arrival_time` | Updated reservation representation. Changing arrival time releases and reassigns its slot when applicable. |
| `DELETE /api/reservations/{reservation}` | Authenticated `admin` only | No body | `{ "message": "Reservasi dibatalkan." }`. |
| `GET /api/users` | Authenticated `admin` only | Bearer token | Raw array of user records containing `id`, `username`, `pin`, `role`, and `is_active`. The frontend normalizer intentionally discards `pin`; do not expose that response field in UI or logs. |
| `POST /api/users` | Authenticated `admin` only | `{ "username": "...", "pin": "012345", "role": "satpam" }` | User representation above; HTTP 201. PIN must also pass the backend's `StrongPin` rule. |
| `PUT /api/users/{user}` | Authenticated `admin` only | Partial `username`, `pin`, `role`, `is_active` | Updated user representation. An admin cannot demote or deactivate their own account. |
| `DELETE /api/users/{user}` | Authenticated `admin` only | No body | `{ "message": "Akun dihapus." }`; self-deletion and deletion with active reservations return 422. |

The controllers use Laravel request validation. Validation errors use HTTP 422 with a message and field errors; route model binding can return 404. Other authorization failures use 403, and unexpected API/server failures are surfaced as a generic server error by the frontend client. The backend returns the slot-list and reservation-list data as arrays rather than requiring a `{ "data": [...] }` envelope.

## Frontend mapping and access flow

- Public slot status maps `empty` → `available`, `booked` → `reserved`, and `occupied` → `occupied`. The public normalizer only retains `code` and status and never reads reservation/customer fields.
- Denah position is local geometry, not backend data. The accepted layout mapping puts API codes `P01`–`P06` at reference positions `A1`–`A6`, `P07`–`P11` at `B1`–`B5`, `P12`–`P15` at `C1`–`C4`, `P16` at `C6`, and `P17`–`P18` at `D1`–`D2`. The displayed operational code remains the API code; the reference position is a secondary layout label. New API codes without configured geometry are listed separately and remain included in API totals.
- Private slot data uses the same status mapping and retains the API slot `id` for the satpam status update. The dashboard does not render customer details from that private relation.
- Reservation rows map `customer_name`, `plate`, `arrival_time`, `slot_code`, and `has_parking`; no phone, duration, or check-in field is assumed.
- Login calls `/api/login`, then `/api/me`. Only a verified `admin` or `satpam` profile enters the corresponding guarded route.
- `/` always loads `/api/public/slots` without a token. `/login` is separate. `/admin` is limited to admins; `/satpam` is limited to satpam. Backend middleware remains the actual authorization boundary.
- Admin reservation and user operations use only the methods registered in `routes/api.php`. Satpam can read private slot state and update slot status, but cannot see admin navigation or invoke admin reservation/user operations through this interface.
- Logout attempts the server request and clears the browser session even if the network request fails; the public page reports when the server-side logout could not be confirmed.

## Error handling

The shared HTTP client maps 401, 403, 404, 409, 422, and 5xx responses to user-facing messages. A 401 from an authenticated request clears the local session. A 409 during a slot update triggers a slot refresh. Network failures and requests that exceed 20 seconds are surfaced, and invalid successful JSON responses are not silently treated as empty data.

No report or QR/scanner route was found in the inspected API route table; the frontend does not claim those operations are backed by this API.
