# STMADB Portal Backend

Backend API untuk aplikasi portal sekolah STMADB yang dibangun dengan Express.js, Prisma ORM, dan MySQL.

## 🚀 Fitur Utama

### Modul Aplikasi
1. **Manajemen Pengguna & Akademik**
   - User management (Admin, Teacher, Student, Staff)
   - Teacher & Student profiles
   - Class & Subject management

2. **Jurnal KBM (Kegiatan Belajar Mengajar)**
   - Schedule management
   - Teaching journals

3. **PKL (Praktik Kerja Lapangan)**
   - Company management
   - Internship placements
   - Internship journals

4. **Presensi & Perizinan**
   - Teacher & Student attendance
   - Leave requests management

5. **Kegiatan Ibadah Ramadan**
   - Ramadan activity tracking

6. **Manajemen Antrean**
   - Queue system for school services

7. **Manajemen Ujian**
   - Exam scheduling
   - Room assignments
   - Incident reports

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Joi
- **File Upload**: Multer
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Struktur Folder

```
stmadb-portal-be/
├── src/
│   ├── config/           # Konfigurasi aplikasi
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Custom middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation schemas
│   └── database/
│       └── seeders/     # Database seeders
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # File uploads directory
├── logs/               # Application logs
├── package.json
└── README.md
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- MySQL (v8.0 atau lebih tinggi)
- npm atau yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd stmadb-portal-be
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy file .env.example ke .env
cp .env.example .env

# Edit file .env dengan konfigurasi Anda
nano .env
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database dengan data awal
npm run db:seed
```

### 5. Start Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/stmadb_portal"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Gunakan Bearer token dalam header Authorization:
```
Authorization: Bearer <your_access_token>
```

### Available Endpoints

#### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile

#### Health Check
- `GET /api/health` - Health check endpoint
- `GET /api` - API information

### Default Login Credentials

Setelah seeding database, gunakan kredensial berikut:

**Admin:**
- Username: `admin`
- Password: `admin123`

**Teacher:**
- Username: `teacher001`
- Password: `teacher123`

**Student:**
- Username: `student001`
- Password: `student123`

## 🗃️ Database Schema

Database terdiri dari 7 modul utama:

1. **User Management**: users, teachers, students
2. **Academic**: classes, subjects, schedules
3. **Teaching**: teaching_journals
4. **Internship**: companies, internship_placements, internship_journals
5. **Attendance**: teacher_attendances, student_attendances, leave_requests
6. **Ramadan**: ramadan_activities
7. **Queue**: queue_counters, queue_tickets
8. **Exam**: exams, exam_schedules, exam_rooms, exam_assignments

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dengan nodemon

# Production
npm start           # Start aplikasi

# Database
npm run db:migrate  # Jalankan migrasi database
npm run db:generate # Generate Prisma client
npm run db:seed     # Seed database
npm run db:studio   # Buka Prisma Studio

# Testing
npm test           # Jalankan tests
npm run test:watch # Jalankan tests dalam watch mode
```

## 📝 API Response Format

Semua response menggunakan format standar:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Security Features

- **JWT Authentication** dengan refresh token
- **Password hashing** menggunakan bcrypt
- **Rate limiting** untuk mencegah spam
- **CORS** configuration
- **Helmet** untuk security headers
- **Input validation** menggunakan Joi
- **File upload validation**

## 📊 Logging

Aplikasi menggunakan Winston untuk logging dengan level:
- `error`: Error messages
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

Log disimpan di folder `logs/`:
- `logs/app.log` - All logs
- `logs/error.log` - Error logs only

## 🚦 Error Handling

Aplikasi memiliki global error handler yang menangani:
- Prisma database errors
- JWT authentication errors
- Validation errors
- File upload errors
- Custom application errors

## 🔄 Development Workflow

1. **Feature Development**
   - Buat branch baru untuk setiap fitur
   - Ikuti naming convention: `feature/module-name`
   - Write tests untuk fitur baru

2. **Database Changes**
   - Update `schema.prisma`
   - Run `npm run db:migrate`
   - Update seeders jika diperlukan

3. **API Development**
   - Buat service layer untuk business logic
   - Buat controller untuk handling requests
   - Buat validator untuk input validation
   - Buat routes dan mount ke `routes/index.js`

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

Untuk bantuan dan pertanyaan, silakan buat issue di repository atau hubungi team development.

---

Dibuat dengan ❤️ untuk STMADB
