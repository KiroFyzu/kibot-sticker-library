# AI Sticker Library

AI Sticker Library adalah aplikasi web full-stack satu project Express.js + EJS untuk menyimpan gambar atau meme, membaca teks dengan OCR, membuat kategori dan tags otomatis, mencari asset berdasarkan metadata, lalu mengubah gambar menjadi stiker WhatsApp format WebP.

## Fitur

- Dashboard dengan total gambar, stiker siap pakai, gambar processing, kategori, dan gambar terbaru.
- Upload JPG, JPEG, PNG, WEBP dengan batas 10MB.
- Penyimpanan original dan sticker ke MinIO S3-compatible object storage.
- Metadata tersimpan di SQLite lewat Prisma ORM.
- OCR utama menggunakan PaddleOCR API.
- OCR cadangan menggunakan `tesseract.js` lokal jika PaddleOCR gagal atau token belum dikonfigurasi.
- Preprocess OCR Tesseract menggunakan Sharp: resize lebar target, grayscale, peningkatan kontras, noise reduction, dan sharpen ringan.
- Auto tagging sederhana lewat `src/services/aiTagger.service.js`.
- Gallery card responsive dengan badge status, kategori, dan tags.
- Detail gambar dengan OCR text, deskripsi, metadata, preview original, preview sticker, convert, download, dan delete.
- Search dari `filename`, `originalName`, `ocrText`, `description`, `category`, dan `tags`.
- Filter kategori di `/categories/:category`.

## Stack

- Node.js
- Express.js
- EJS
- SQLite
- Prisma ORM
- MinIO Object Storage
- multer
- sharp
- tesseract.js
- dotenv
- method-override

Node.js 18 atau lebih baru dibutuhkan karena integrasi PaddleOCR memakai `fetch`, `FormData`, dan `Blob` bawaan Node.

## Install

```bash
npm install
```

## Setup Environment

Salin `.env.example` menjadi `.env`, lalu isi credential MinIO.

```bash
cp .env.example .env
```

Contoh konfigurasi:

```env
PORT=3000
DATABASE_URL="file:./dev.db"

MINIO_ENDPOINT=192.168.1.20
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=ISI_ACCESS_KEY_DARI_ENV
MINIO_SECRET_KEY=ISI_SECRET_KEY_DARI_ENV
MINIO_BUCKET_ORIGINAL=stickers-original
MINIO_BUCKET_STICKER=stickers-webp
MINIO_BUCKET_THUMBNAIL=stickers-thumbnail
MINIO_PUBLIC_BASE_URL=http://192.168.1.20:9000

OCR_LANG=eng
OCR_PREPROCESS_WIDTH=1400
OCR_PRIMARY_PROVIDER=paddleocr
PADDLEOCR_API_TOKEN=ISI_TOKEN_PADDLEOCR_DARI_ENV
PADDLEOCR_JOB_URL=https://paddleocr.aistudio-app.com/api/v2/ocr/jobs
PADDLEOCR_MODEL=PaddleOCR-VL-1.6
PADDLEOCR_POLL_INTERVAL_MS=5000
PADDLEOCR_TIMEOUT_MS=120000
```

Jangan hardcode access key atau secret key MinIO di source code. Jangan commit file `.env`.

Token PaddleOCR juga harus disimpan di `.env` lewat `PADDLEOCR_API_TOKEN`, bukan di source code.

## Prisma SQLite

Jalankan migration untuk membuat database SQLite dan Prisma Client.

```bash
npx prisma migrate dev
```

Atau lewat script:

```bash
npm run prisma:migrate
```

Untuk membuka Prisma Studio:

```bash
npm run prisma:studio
```

## MinIO

Aplikasi memakai MinIO endpoint:

```text
http://192.168.1.20:9000
```

Saat aplikasi start, `storage.service.ensureBuckets()` otomatis memeriksa dan membuat bucket berikut jika belum ada:

- `stickers-original`
- `stickers-webp`
- `stickers-thumbnail`

Pastikan credential MinIO punya izin membuat bucket, upload object, read object, dan delete object.

Bucket MinIO boleh tetap private. Preview original dan sticker di UI diarahkan lewat route Express yang membuat presigned URL sementara, sehingga browser tidak perlu akses public permanen ke bucket.

## Menjalankan Aplikasi

```bash
npm run dev
```

Aplikasi berjalan di:

```text
http://localhost:3000
```

Production:

```bash
npm start
```

## Endpoint Route

- `GET /` - dashboard.
- `GET /upload` - form upload gambar.
- `POST /upload` - upload gambar, simpan original ke MinIO, simpan metadata, OCR, tagging.
- `GET /images` - gallery semua gambar.
- `GET /images/:id` - detail gambar.
- `GET /images/:id/original` - preview original via presigned URL sementara.
- `GET /images/:id/sticker` - preview sticker via presigned URL sementara.
- `POST /images/:id/convert` - convert gambar menjadi WebP 512x512 dan upload ke bucket sticker.
- `GET /images/:id/download-sticker` - download sticker via presigned URL.
- `POST /images/:id/delete` - hapus database row dan object MinIO.
- `GET /search?q=` - search gambar.
- `GET /categories/:category` - filter gambar berdasarkan kategori.

## Cara Upload Gambar

1. Buka `/upload`.
2. Pilih file JPG, JPEG, PNG, atau WEBP maksimal 10MB.
3. Submit.
4. Aplikasi upload original ke bucket MinIO `stickers-original`.
5. Aplikasi menjalankan OCR dan auto tagging.
6. Status berubah dari `processing` menjadi `ready`, atau `failed` jika OCR/tagging gagal.

## Cara Convert ke Sticker

1. Buka `/images` atau detail gambar.
2. Klik `Convert`.
3. Aplikasi mengambil original dari MinIO, resize ke 512x512 dengan background transparan, convert ke WebP, dan upload ke bucket `stickers-webp`.
4. Tombol `Download` muncul setelah sticker tersedia.

## Cara Search

Buka:

```text
/search?q=deadline
```

Search mencari sebagian teks dari:

- filename
- originalName
- ocrText
- description
- category
- tags

Contoh OCR text `ketika deadline tugas besok tapi belum mulai` tetap bisa ditemukan dengan keyword seperti `deadline`, `tugas`, `besok`, `belum mulai`, `kuliah`, atau `panik` jika tags otomatis terbentuk dari konteks tersebut.

## Security

- Credential MinIO hanya dibaca dari environment variable.
- `.env` masuk `.gitignore`.
- Upload dibatasi maksimal 10MB.
- File upload divalidasi hanya `image/jpeg`, `image/png`, dan `image/webp`.
- File temporary di `tmp/uploads` dibersihkan setelah proses upload selesai.
- Access key dan secret key tidak ditampilkan di UI.
