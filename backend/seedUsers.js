require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedUsers = async () => {
  await connectDB();

  const testAccounts = [
    {
      name: 'Certified Administrator',
      email: 'admin@certified.test',
      password: 'Password123!',
      role: 'admin',
      organization: 'Certified Authority',
    },
    {
      name: 'Certified Student',
      email: 'student@certified.test',
      password: 'Password123!',
      role: 'student',
      organization: 'Northbridge University',
    },
    {
      name: 'Demo Administrator',
      email: 'demologin.admin@certified.test',
      password: 'DemoPassword123!',
      role: 'admin',
      organization: 'Certified Authority (Demo)',
    },
    {
      name: 'Demo Student',
      email: 'demologin.student@certified.test',
      password: 'DemoPassword123!',
      role: 'student',
      organization: 'Northbridge University (Demo)',
    },
  ];

  for (const account of testAccounts) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      existing.name = account.name;
      existing.password = account.password;
      existing.role = account.role;
      existing.organization = account.organization;
      await existing.save();
      console.log(`Updated account: ${account.email} (${account.role})`);
    } else {
      await User.create(account);
      console.log(`Created account: ${account.email} (${account.role})`);
    }
  }

  await mongoose.disconnect();
  console.log('Seed completed successfully.');
};

if (require.main === module) {
  seedUsers().catch((err) => {
    console.error('Seed error:', err.message);
    process.exit(1);
  });
}

module.exports = seedUsers;
