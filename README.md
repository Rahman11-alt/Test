# SISTEM ADMINISTRASI KELAS 6
## MIS COKROAMINOTO PANYINGKIRAN · Tahun Pelajaran 2026/2027

Aplikasi web administrasi kelas dengan frontend HTML/CSS/JavaScript dan backend Google Apps Script + Google Sheets.

## A. Arsitektur
Browser HP/Komputer → GitHub Pages → REST API Google Apps Script → Google Sheets/Google Drive.

Data utama TIDAK disimpan sebagai database di localStorage. Session login memakai sessionStorage agar password/token tidak menjadi bagian dari database.

## B. Database
Buat satu Google Spreadsheet lalu jalankan `setupDatabase()` atau `setupAdmin()`. Sheet:
SISWA, GURU, KELAS, NILAI, ABSENSI, LOG.

Header sesuai spesifikasi proyek.

## C. Struktur folder
administrasi-kelas-6/
- index.html
- style.css
- script.js
- Code.gs
- README.md
- assets/
  - logo.png
  - favicon.png
- template/
  - template-data-siswa.xlsx

## D. Code.gs
Salin seluruh isi `Code.gs` ke Apps Script.

## E. index.html
Upload/push ke GitHub Pages bersama style.css dan script.js.

## F. style.css
Sudah disediakan.

## G. script.js
Sebelum digunakan, ubah:
`const API_URL = "[ISI DI SINI]";`
menjadi URL Web App Apps Script hasil deployment.

## H. README
Dokumen ini adalah panduan instalasi.

## I. Instalasi langkah demi langkah
1. Buat Google Spreadsheet baru.
2. Buka Extensions → Apps Script.
3. Hapus kode awal, tempel `Code.gs`.
4. Simpan.
5. Pada fungsi `setupAdmin()`, ganti password `[ISI DI SINI]` dengan password pilihan Anda. Jangan membagikan password.
6. Jalankan `setupAdmin()` satu kali. Berikan izin Google sesuai kebutuhan.
7. Pastikan sheet SISWA, GURU, KELAS, NILAI, ABSENSI, LOG terbentuk.
8. Pilih Deploy → New deployment → Web app.
9. Execute as: Me.
10. Who has access: pilih opsi akses yang sesuai dengan kebutuhan. Untuk frontend GitHub Pages yang diakses guru, endpoint harus dapat menerima request dari pengguna yang dituju.
11. Salin URL Web App.
12. Buka `script.js`.
13. Ganti `[ISI DI SINI]` pada `API_URL` dengan URL tersebut.
14. Jangan menaruh username/password administrator ke JavaScript frontend.
15. Push seluruh proyek ke repository GitHub.
16. Aktifkan Settings → Pages → Deploy from branch.
17. Buka alamat GitHub Pages.

## J. Deploy Apps Script
Jika Code.gs berubah, lakukan Deploy → Manage deployments → Edit → New version → Deploy. URL biasanya tetap sama pada deployment yang diedit.

## K. Deploy GitHub Pages
Upload index.html, style.css, script.js, assets, dan template. Jangan upload file yang berisi password.

## L. Testing
- [ ] Login berhasil
- [ ] Dashboard tampil
- [ ] Data siswa tampil
- [ ] Tambah siswa berhasil
- [ ] Data masuk Google Sheets
- [ ] Edit siswa berhasil
- [ ] Perubahan masuk Google Sheets
- [ ] Hapus dengan konfirmasi
- [ ] Pencarian bekerja
- [ ] Filter kelas bekerja
- [ ] Import Excel/CSV bekerja
- [ ] NISN ganda ditolak
- [ ] Export Excel bekerja
- [ ] Backup membuat salinan Drive
- [ ] Website terbuka dari HP
- [ ] Website terbuka dari komputer lain
- [ ] Data tetap ada setelah browser ditutup
- [ ] Error koneksi ditangani
- [ ] Log aktivitas tercatat

## M. Troubleshooting
### API_URL belum diisi
Edit `script.js` dan isi URL Web App.

### CORS / Failed to fetch
Pastikan deployment Apps Script adalah Web App dan aksesnya sesuai kebutuhan. Jangan membuka file HTML secara lokal (`file://`) untuk pengujian API; gunakan GitHub Pages atau server statis.

### Sesi berakhir
Login kembali. CacheService memang memiliki masa berlaku terbatas.

### Data tidak masuk
Periksa izin Apps Script, nama sheet, header, dan Executed as: Me.

### Password
Password tidak disimpan di frontend. Untuk mengganti password, edit `setupAdmin()`, isi password baru, jalankan sekali, lalu kembalikan placeholder `[ISI DI SINI]` sebelum menyimpan kode.

## Restore backup
Backup dari menu Export & Backup membuat salinan Spreadsheet di Google Drive. Untuk restore, buka salinan tersebut dan gunakan sebagai database baru atau salin kembali sheet datanya ke spreadsheet utama. Lakukan dengan hati-hati dan buat backup sebelum restore.

## Catatan keamanan
Aplikasi ini cocok untuk administrasi kelas skala kecil. Untuk data pribadi siswa, batasi akses Spreadsheet dan Web App kepada pihak yang berwenang. Gunakan password kuat dan jangan menaruh kredensial di GitHub.

## Prinsip
Input sekali → tersimpan permanen di Google Sheets → dapat diakses kembali kapan saja dan dari perangkat mana saja.
