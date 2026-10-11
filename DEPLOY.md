# LAPAK GAMER — VPS NAT (Termius)

Paket ini sudah berisi **website + API Node.js dalam satu aplikasi**. Tidak perlu hosting frontend terpisah, Supabase, atau mengisi alamat API lain. Data listing disimpan di `data/listings.json`.

## Persyaratan
- VPS NAT dengan Node.js 18+ dan npm
- Port TCP yang bisa diakses dari internet (port forwarding dari penyedia VPS NAT)
- Akses SSH melalui Termius

## 1. Upload dan ekstrak ZIP
Upload file `LAPAK_GAMER_VPS_NAT_READY.zip` ke folder home VPS memakai SFTP di Termius, lalu jalankan perintah berikut:

```bash
mkdir -p ~/lapak-gamer
cd ~/lapak-gamer
unzip ~/LAPAK_GAMER_VPS_NAT_READY.zip
```

Jika hasil ekstrak membentuk folder `LAPAK_GAMER_VPS_NAT`, masuk ke folder itu:
```bash
cd ~/lapak-gamer/LAPAK_GAMER_VPS_NAT
```

Jika ZIP Anda diunggah ke folder lain, sesuaikan lokasi perintah `unzip`. Alternatifnya, ekstrak ZIP melalui file manager lalu `cd` ke folder yang berisi `package.json`.

## 2. Pasang Node.js bila belum ada
Cek dahulu:
```bash
node -v
npm -v
```
Jika perintah tidak ditemukan, pasang Node.js 20 LTS sesuai distro VPS Anda. Pada Ubuntu/Debian, Anda bisa memakai repositori NodeSource resmi atau pengelola versi Node yang tepercaya. Jangan lanjut sebelum `node -v` dan `npm -v` berhasil.

## 3. Konfigurasi rahasia
```bash
cp .env.example .env
nano .env
```
Ubah `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. Gunakan password admin unik minimal 12 karakter. Simpan nano dengan `Ctrl+O`, Enter, lalu keluar `Ctrl+X`. Jangan bagikan file `.env`.

Contoh:
```env
HOST=0.0.0.0
PORT=3000
ADMIN_EMAIL=admin@lapak-gamer.local
ADMIN_PASSWORD=GantiIniDenganPasswordPanjangYangUnik
DB_FILE=./data/listings.json
```
Email pada `.env` harus sama dengan `ADMIN_EMAIL` di `public/config.js`. Jika Anda mengubah email di `.env`, ubah juga `public/config.js`.

## 4. Instal dan jalankan
```bash
npm install
npm run check
npm start
```
Tes health check dari SSH:
```bash
curl http://127.0.0.1:3000/health
```
Hasil normal mengandung `"ok":true`. Biarkan proses tetap berjalan saat tes pertama.

## 5. Agar tetap online setelah SSH ditutup (PM2)
Buka sesi SSH lain atau hentikan proses tes dengan `Ctrl+C`, lalu jalankan:
```bash
npm install -g pm2
pm2 start server.js --name lapak-gamer
pm2 save
pm2 status
pm2 logs lapak-gamer
```
Untuk restart sesudah mengubah konfigurasi:
```bash
pm2 restart lapak-gamer
```
Catatan: `pm2 startup` dapat memerlukan hak akses tambahan dan bergantung pada distro/provider VPS.

## 6. Akses dari internet pada VPS NAT
Aplikasi mendengarkan di `0.0.0.0:3000`. **Port 3000 harus dipetakan/dibuka oleh provider VPS NAT** agar bisa diakses dari internet. Di panel/provider NAT, cari menu port forwarding lalu petakan port publik TCP yang diberikan provider ke port internal `3000`.

Jika provider memberi port publik berbeda, misalnya `45678`, akses:
`http://IP-PUBLIK-ATAU-HOST:45678`

Jangan asal menggunakan port contoh. Gunakan IP/domain dan port publik yang benar-benar diberikan provider. Jika port 3000 internal tidak dapat dipetakan, ganti `PORT` di `.env` menjadi port internal yang diizinkan, kemudian `pm2 restart lapak-gamer`.

Untuk uji awal, HTTP dapat digunakan. Sebelum dipakai publik, disarankan pasang domain + HTTPS melalui reverse proxy (mis. Nginx/Caddy) dan sertifikat TLS. Jangan masukkan password admin lewat jaringan publik HTTP karena koneksi tidak terenkripsi.

## 7. Cara menggunakan
1. Buka alamat website dari browser.
2. Klik **Pasang Lapak**, isi form, dan kirim. Listing baru berstatus **pending**.
3. Klik **Masuk Admin**, gunakan email dan password di `.env`.
4. Setujui listing agar tampil di katalog, atau tolak/hapus melalui panel admin.
5. Data tersimpan pada `data/listings.json` di server. Backup file ini secara berkala.

## Endpoint tes
- `GET /health` — status server
- `GET /api/v1/listings` — listing yang sudah disetujui
- `POST /api/v1/listings` — mengirim listing baru
- `POST /api/v1/admin/login` — login admin

## Catatan
- Ini adalah katalog/listing marketplace, bukan payment gateway dan belum mengotomatisasi pembayaran.
- Jangan hapus folder `data/`; file database berisi listing yang tersimpan.
- Untuk backup: `cp data/listings.json data/listings-backup-$(date +%F).json`
