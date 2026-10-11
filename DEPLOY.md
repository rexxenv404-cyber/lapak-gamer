# Deploy Website LAPAK GAMER

1. Pastikan API Pterodactyl aktif dan `GET /health` mengembalikan `ok: true`.
2. Atur `config.js` dengan URL publik API.
3. Atur `CORS_ORIGINS` di environment API ke origin website frontend persis (contoh `https://lapak-gamer.pages.dev`). Restart API setelah mengubah env.
4. Jika frontend memakai HTTPS, API wajib HTTPS juga. Port Pterodactyl biasa tanpa sertifikat/TLS mungkin perlu reverse proxy HTTPS.
5. Upload ke static host seluruh file di folder ini, bukan ZIP backend.
6. Buka website; indikator `API TERHUBUNG` menunjukkan API dapat diakses. Kirim listing uji, lalu setujui melalui panel admin.
