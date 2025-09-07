/**
 * Standard API Response Format
 */
class ApiResponse {
  constructor(success = true, message = '', data = null, meta = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    
    if (meta) {
      this.meta = meta;
    }
  }

  static success(message = 'Success', data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message = 'Error', data = null) {
    return new ApiResponse(false, message, data);
  }
}

/**
 * Pagination utility
 */
class Pagination {
  constructor(page = 1, limit = 10, total = 0) {
    this.page = parseInt(page) > 0 ? parseInt(page) : 1;
    this.limit = parseInt(limit) > 0 ? parseInt(limit) : 10;
    this.total = parseInt(total);
    this.totalPages = Math.ceil(this.total / this.limit);
    this.hasNext = this.page < this.totalPages;
    this.hasPrev = this.page > 1;
  }

  getOffset() {
    return (this.page - 1) * this.limit;
  }

  getMeta() {
    return {
      pagination: {
        page: this.page,
        limit: this.limit,
        total: this.total,
        totalPages: this.totalPages,
        hasNext: this.hasNext,
        hasPrev: this.hasPrev,
      }
    };
  }
}

/**
 * Helper untuk membuat slug dari string
 */
function createSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Helper untuk format tanggal Indonesia
 */
function formatDateIndonesia(date) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const days = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];
  
  const d = new Date(date);
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Helper untuk generate token acak
 */
function generateRandomToken(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Helper untuk validasi email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper untuk validasi nomor telepon Indonesia
 */
function isValidPhoneNumber(phone) {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone);
}

/**
 * Helper untuk sanitasi input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential script tags
    .substring(0, 255); // Limit length
}

/**
 * Helper untuk konversi BigInt ke string dalam response JSON
 */
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

module.exports = {
  ApiResponse,
  Pagination,
  createSlug,
  formatDateIndonesia,
  generateRandomToken,
  isValidEmail,
  isValidPhoneNumber,
  sanitizeInput,
  serializeBigInt,
};
