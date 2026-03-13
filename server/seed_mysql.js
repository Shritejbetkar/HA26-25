import pool from './db.js';

const seed = async () => {
  try {
    // Temporarily disable foreign key checks to allow REPLACE INTO on users
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    // Insert Sample Employers
    const employers = [
      ['employer1', 'employer', 'Shripad Chavan', 'shripad@example.com', 0, 0, 0, 1, 'Pune', 'Pune', 'Maharashtra'],
      ['employer2', 'employer', 'Sumukh Chavan', 'sumukh@example.com', 0, 0, 0, 1, 'Pune', 'Pune', 'Maharashtra']
    ];

    for (const e of employers) {
      await pool.query(`
        REPLACE INTO users (uid, role, fullName, email, experience, wage, dakshScore, isVerified, city, district, state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, e);
    }

    // Insert Sample Workers
    const workers = [
      ['worker1', 'worker', 'Rajesh Kumar', 'rajesh@example.com', 'Electrician', 5, 500, 'Experienced home electrician', 85, 1, 'Pune', 'Pune', 'Maharashtra'],
      ['worker2', 'worker', 'Sunita Devi', 'sunita@example.com', 'Tailor', 3, 300, 'Specialist in local garments', 90, 1, 'Mumbai', 'Mumbai', 'Maharashtra'],
      ['worker3', 'worker', 'Amit Singh', 'amit@example.com', 'Plumber', 4, 450, 'Expert in pipe fitting and repair', 78, 0, 'Pune', 'Pune', 'Maharashtra']
    ];

    for (const w of workers) {
      await pool.query(`
        REPLACE INTO users (uid, role, fullName, email, trade, experience, wage, bio, dakshScore, isVerified, city, district, state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, w);
    }

    // Insert Sample Jobs
    const jobs = [
      ['job1', 'employer1', 'Shripad Chavan', 'Need Home Electrician', 'Fixing wiring in rural home', 'Electrician', 600, 'Pune', 'Pune', 'Maharashtra'],
      ['job2', 'employer2', 'Sumukh Chavan', 'Urgent Plumbing Repair', 'Leaking tap repair', 'Plumber', 400, 'Mumbai', 'Mumbai', 'Maharashtra'],
      ['job3', 'employer1', 'Shripad Chavan', 'Carpentry for furniture', 'Making wooden chairs', 'Carpenter', 800, 'Pune', 'Pune', 'Maharashtra']
    ];

    for (const j of jobs) {
      await pool.query(`
        REPLACE INTO jobs (id, employerId, employerName, title, description, skillRequired, wage, city, district, state, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `, j);
    }

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log("MySQL Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    // Ensure checks are re-enabled even on failure
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
