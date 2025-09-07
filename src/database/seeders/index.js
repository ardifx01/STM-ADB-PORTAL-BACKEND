const { 
  seedUsers, 
  seedSubjects, 
  seedClasses, 
  seedCompanies, 
  seedQueueCounters 
} = require('./seeders');

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Run all seeders
    await seedUsers();
    await seedSubjects();
    await seedClasses();
    await seedCompanies();
    await seedQueueCounters();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('Admin: username: admin, password: admin123');
    console.log('Teacher: username: teacher001, password: teacher123');
    console.log('Student: username: student001, password: student123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
