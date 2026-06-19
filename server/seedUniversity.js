const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');

dotenv.config();

const departments = [
  {
    name: 'Cybersecurity & Information Assurance',
    code: 'CSIA',
    description: 'Undergraduate and graduate cybersecurity programs — labs, CTF, and incident response.'
  },
  {
    name: 'Computer Science',
    code: 'CSCI',
    description: 'Core CS curriculum with security electives and practical lab components.'
  },
  {
    name: 'Digital Forensics',
    code: 'DFOR',
    description: 'Forensics, malware analysis, and investigative techniques.'
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await Department.deleteMany({});
    await Department.insertMany(departments);
    console.log(`Seeded ${departments.length} departments`);
    mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seed();
