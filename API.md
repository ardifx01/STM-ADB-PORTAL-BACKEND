# API Documentation - STMADB Portal Backend

## Overview
API Backend untuk Portal Sekolah STMADB dengan sistem manajemen lengkap yang mencakup pengguna, akademik, presensi, ujian, dan fitur khusus seperti PKL dan kegiatan Ramadan.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Aplikasi menggunakan JWT (JSON Web Token) untuk autentikasi. Token harus disertakan dalam header Authorization untuk endpoint yang memerlukan autentikasi.

```http
Authorization: Bearer <access_token>
```

## Standard Response Format

### Success Response
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

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Health Check

#### Get API Health Status
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "STMADB Portal Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Authentication

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "username": "admin",
      "role": "admin",
      "is_active": true,
      "teacher": null,
      "student": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get User Profile
```http
GET /api/auth/profile
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "1",
    "username": "teacher001",
    "role": "teacher",
    "is_active": true,
    "last_login": "2024-01-01T10:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "teacher": {
      "id": "1",
      "full_name": "Budi Santoso, S.Pd",
      "nip": "196801011990031001",
      "nik": "3201010101680001",
      "phone_number": "081234567890",
      "employment_status": "ASN"
    }
  }
}
```

#### Change Password
```http
PUT /api/auth/change-password
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password changed successfully"
  }
}
```

#### Logout
```http
POST /api/auth/logout
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input data |
| 401  | Unauthorized - Invalid or missing authentication |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Duplicate data |
| 422  | Unprocessable Entity - Validation error |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error - Server error |

## Rate Limiting

API memiliki rate limiting untuk mencegah spam:
- **Window**: 15 menit
- **Max Requests**: 100 requests per IP per window
- **Headers**: Response akan menyertakan header rate limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## User Roles

| Role | Description |
|------|-------------|
| admin | Administrator dengan akses penuh |
| teacher | Guru dengan akses untuk mengajar dan manajemen kelas |
| student | Siswa dengan akses terbatas |
| staff | Staff sekolah dengan akses administratif terbatas |

## Default Test Accounts

Setelah seeding database:

**Admin:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Teacher:**
- Username: `teacher001`
- Password: `teacher123`
- Role: `teacher`

**Student:**
- Username: `student001`
- Password: `student123`
- Role: `student`

## Data Types & Enums

### User Roles
- `admin`
- `teacher`
- `student`
- `staff`

### Employment Status (Teachers)
- `ASN` - Aparatur Sipil Negara
- `GTT` - Guru Tidak Tetap
- `PTT` - Pegawai Tidak Tetap
- `Tetap` - Pegawai Tetap

### Gender
- `L` - Laki-laki
- `P` - Perempuan

### Student Status
- `AKTIF` - Active student
- `LULUS` - Graduated
- `PINDAH` - Transferred
- `DO` - Dropped out

### Attendance Status
- `Masuk` - Check in
- `Pulang` - Check out

### Days of Week
- `Senin` - Monday
- `Selasa` - Tuesday
- `Rabu` - Wednesday
- `Kamis` - Thursday
- `Jumat` - Friday
- `Sabtu` - Saturday
- `Minggu` - Sunday

### Approval Status
- `Pending` - Waiting for approval
- `Approved` - Approved
- `Rejected` - Rejected

### Leave Types
- `Sakit` - Sick leave
- `Izin` - Permission
- `Cuti` - Vacation
- `DinasLuar` - Official duty

## File Upload

### Supported File Types

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)

**Documents:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)

### Upload Limits
- **Max File Size**: 5MB
- **Max Files**: 5 files per request

### Upload Endpoints
Files dapat diupload ke endpoint yang mendukung menggunakan `multipart/form-data`:

```http
Content-Type: multipart/form-data
```

**Form Fields:**
- `photo` - For profile photos
- `signature` - For signature images
- `attachment` - For document attachments
- `document` - For general documents

## Pagination

Untuk endpoint yang mengembalikan list data, gunakan query parameters:

```http
GET /api/endpoint?page=1&limit=10&search=keyword
```

**Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search keyword (optional)

## Date Formats

- **Date**: ISO 8601 format (`YYYY-MM-DD`)
- **DateTime**: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Time**: 24-hour format (`HH:mm:ss`)

## Examples

### Login Flow
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data: { tokens } } = await loginResponse.json();

// 2. Use access token for authenticated requests
const profileResponse = await fetch('/api/auth/profile', {
  headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
});

// 3. Refresh token when access token expires
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: tokens.refreshToken
  })
});
```

## Development Notes

- Semua endpoint menggunakan JSON untuk request dan response
- Password di-hash menggunakan bcrypt dengan salt rounds 12
- JWT token menggunakan HS256 algorithm
- Database menggunakan BigInt untuk ID (dikembalikan sebagai string dalam JSON)
- Timezone default adalah UTC
- Logging menggunakan Winston dengan format JSON

## Coming Soon

Endpoint yang akan segera ditambahkan:
- User Management (`/api/users`)
- Teacher Management (`/api/teachers`)
- Student Management (`/api/students`)
- Class Management (`/api/classes`)
- Subject Management (`/api/subjects`)
- Schedule Management (`/api/schedules`)
- Attendance Management (`/api/attendance`)
- Teaching Journals (`/api/journals`)
- Internship Management (`/api/internships`)
- Exam Management (`/api/exams`)
- Queue Management (`/api/queue`)
- Ramadan Activities (`/api/ramadan`)
