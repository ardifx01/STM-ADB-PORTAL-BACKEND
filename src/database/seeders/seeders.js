const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../../utils/auth');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users...');

  // Admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      is_active: true,
    },
  });

  // Sample teacher user
  const teacherPassword = await hashPassword('teacher123');
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher001' },
    update: {},
    create: {
      username: 'teacher001',
      password: teacherPassword,
      role: 'teacher',
      is_active: true,
    },
  });

  // Create teacher profile
  await prisma.teacher.upsert({
    where: { user_id: teacherUser.id },
    update: {},
    create: {
      user_id: teacherUser.id,
      nip: '196801011990031001',
      nik: '3201010101680001',
      full_name: 'Budi Santoso, S.Pd',
      phone_number: '081234567890',
      employment_status: 'ASN',
    },
  });

  // Sample student user
  const studentPassword = await hashPassword('student123');
  const studentUser = await prisma.user.upsert({
    where: { username: 'student001' },
    update: {},
    create: {
      username: 'student001',
      password: studentPassword,
      role: 'student',
      is_active: true,
    },
  });

  // Create student profile
  await prisma.student.upsert({
    where: { user_id: studentUser.id },
    update: {},
    create: {
      user_id: studentUser.id,
      nis: '2024001',
      nisn: '0012345678',
      full_name: 'Siti Nurhaliza',
      gender: 'P',
      address: 'Jl. Pendidikan No. 123, Jakarta',
      phone_number: '081234567891',
      status: 'AKTIF',
    },
  });

  console.log('✅ Users seeded successfully');
  return { admin, teacherUser, studentUser };
}

async function seedSubjects() {
  console.log('🌱 Seeding subjects...');

  const subjects = [
    { subject_code: 'MTK', subject_name: 'Matematika' },
    { subject_code: 'IPA', subject_name: 'Ilmu Pengetahuan Alam' },
    { subject_code: 'IPS', subject_name: 'Ilmu Pengetahuan Sosial' },
    { subject_code: 'BIN', subject_name: 'Bahasa Indonesia' },
    { subject_code: 'ENG', subject_name: 'Bahasa Inggris' },
    { subject_code: 'AGM', subject_name: 'Pendidikan Agama Islam' },
    { subject_code: 'PKN', subject_name: 'Pendidikan Kewarganegaraan' },
    { subject_code: 'SEN', subject_name: 'Seni Budaya' },
    { subject_code: 'PJK', subject_name: 'Pendidikan Jasmani' },
    { subject_code: 'TIK', subject_name: 'Teknologi Informasi dan Komunikasi' },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { subject_code: subject.subject_code },
      update: {},
      create: subject,
    });
  }

  console.log('✅ Subjects seeded successfully');
}

async function seedClasses() {
  console.log('🌱 Seeding classes...');

  const classes = [
    { class_name: 'X IPA 1', grade_level: 10, major: 'IPA' },
    { class_name: 'X IPA 2', grade_level: 10, major: 'IPA' },
    { class_name: 'X IPS 1', grade_level: 10, major: 'IPS' },
    { class_name: 'XI IPA 1', grade_level: 11, major: 'IPA' },
    { class_name: 'XI IPA 2', grade_level: 11, major: 'IPA' },
    { class_name: 'XI IPS 1', grade_level: 11, major: 'IPS' },
    { class_name: 'XII IPA 1', grade_level: 12, major: 'IPA' },
    { class_name: 'XII IPA 2', grade_level: 12, major: 'IPA' },
    { class_name: 'XII IPS 1', grade_level: 12, major: 'IPS' },
  ];

  for (const classData of classes) {
    // Check if class already exists
    const existingClass = await prisma.class.findFirst({
      where: { class_name: classData.class_name }
    });

    if (!existingClass) {
      await prisma.class.create({
        data: classData,
      });
    }
  }

  console.log('✅ Classes seeded successfully');
}

async function seedCompanies() {
  console.log('🌱 Seeding companies for internships...');

  const companies = [
    {
      name: 'PT. Teknologi Maju Bersama',
      address: 'Jl. Sudirman No. 45, Jakarta Pusat',
      coordinates: '-6.208763,106.845599',
    },
    {
      name: 'CV. Digital Kreatif Indonesia',
      address: 'Jl. Gatot Subroto No. 12, Jakarta Selatan',
      coordinates: '-6.234567,106.845678',
    },
    {
      name: 'PT. Industri Manufaktur Nusantara',
      address: 'Jl. HR Rasuna Said No. 78, Jakarta Selatan',
      coordinates: '-6.223456,106.834567',
    },
  ];

  for (const company of companies) {
    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { name: company.name }
    });

    if (!existingCompany) {
      await prisma.company.create({
        data: company,
      });
    }
  }

  console.log('✅ Companies seeded successfully');
}

async function seedQueueCounters() {
  console.log('🌱 Seeding queue counters...');

  const counters = [
    { counter_name: 'Tata Usaha', counter_code: 'TU', is_active: true },
    { counter_name: 'Bimbingan Konseling', counter_code: 'BK', is_active: true },
    { counter_name: 'Perpustakaan', counter_code: 'PERP', is_active: true },
    { counter_name: 'Kesiswaan', counter_code: 'KESIS', is_active: true },
  ];

  for (const counter of counters) {
    await prisma.queueCounter.upsert({
      where: { counter_code: counter.counter_code },
      update: {},
      create: counter,
    });
  }

  console.log('✅ Queue counters seeded successfully');
}

module.exports = {
  seedUsers,
  seedSubjects,
  seedClasses,
  seedCompanies,
  seedQueueCounters,
};
