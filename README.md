# LAPAK GAMER — Website Terhubung API Pterodactyl

Frontend statis HTML/CSS/JS yang mengambil dan menyimpan listing melalui API Node.js dengan database file lokal di server Pterodactyl. Tidak memakai Supabase.

## Konfigurasi koneksi
1. Buka `config.js`.
2. Isi `API_BASE_URL` dengan alamat publik API, misalnya `https://api.domain-kamu.com` atau `http://HOST:3033` untuk uji HTTP.
3. `ADMIN_EMAIL` harus sama dengan `ADMIN_EMAIL` pada environment backend.
4. Upload seluruh isi folder ini ke hosting web statis.

**Penting:** jika website di-host pada HTTPS (GitHub Pages/Cloudflare Pages/Netlify), browser akan memblokir API HTTP (mixed content). API perlu HTTPS/reverse proxy, lalu gunakan URL HTTPS di `config.js`. Di backend, set `CORS_ORIGINS` ke origin website persis, misalnya `https://nama-situs.pages.dev` (tanpa slash terakhir). Jangan set CORS ke URL API.

## Fitur
- Katalog mengambil listing approved dari API.
- Form pasang lapak mengirim listing ke API; listing masuk status pending.
- Login admin dilakukan melalui API dan token disimpan sementara di session browser.
- Admin bisa menyetujui, menolak, menjadikan pilihan, dan menghapus listing.
- Semua perangkat melihat listing dari file database yang sama pada server.

## Deploy
Upload `index.html`, `style.css`, `app.js`, dan `config.js` ke hosting statis. Backend harus aktif lebih dulu. Tes backend di `/health`, lalu buka website dan periksa indikator API di kanan bawah.
