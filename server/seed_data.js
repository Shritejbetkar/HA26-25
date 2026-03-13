import { initDb } from './db.js';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Create a direct pool for seeding
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daksh_bharat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const seed = async () => {
  try {
    console.log("Initializing database schema...");
    await initDb();

    console.log("Seeding data...");
    // Temporarily disable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    // Insert 10 Workers
    const workers = [
      ['w1', 'worker', 'Rajesh Patil', 'rajesh.p@example.com', 'Electrician', 8, 600, 'Expert in residential wiring and motor repair', 92, 1, 'Pune', 'Pune', 'Maharashtra', 'https://picsum.photos/seed/w1/200', '["Wiring", "Repair", "Solar"]', '["Verified", "Top Rated"]'],
      ['w2', 'worker', 'Sunita Deshmukh', 'sunita.d@example.com', 'Tailor', 12, 400, 'Specialist in traditional Maharashtrian attire', 95, 1, 'Satara', 'Satara', 'Maharashtra', 'https://picsum.photos/seed/w2/200', '["Stitching", "Design"]', '["Verified"]'],
      ['w3', 'worker', 'Amit Shinde', 'amit.s@example.com', 'Plumber', 5, 500, 'Certified plumber for industrial and home pipes', 88, 1, 'Pune', 'Pune', 'Maharashtra', 'https://picsum.photos/seed/w3/200', '["Piping", "Leakage Fix"]', '["Aadhaar Verified"]'],
      ['w4', 'worker', 'Ganesh More', 'ganesh.m@example.com', 'Carpenter', 15, 800, 'Master craftsman for custom furniture', 98, 1, 'Kolhapur', 'Kolhapur', 'Maharashtra', 'https://picsum.photos/seed/w4/200', '["Furniture", "Woodwork"]', '["Verified", "Skill Certified"]'],
      ['w5', 'worker', 'Priya Kulkarni', 'priya.k@example.com', 'Painter', 4, 350, 'Wall painting and texture specialist', 82, 0, 'Nashik', 'Nashik', 'Maharashtra', 'https://picsum.photos/seed/w5/200', '["Painting", "Texture"]', '[]'],
      ['w6', 'worker', 'Suresh Jadhav', 'suresh.j@example.com', 'Driver', 10, 700, 'Heavy vehicle driver with valid license', 90, 1, 'Nagpur', 'Nagpur', 'Maharashtra', 'https://picsum.photos/seed/w6/200', '["Driving", "Maintenance"]', '["Verified"]'],
      ['w7', 'worker', 'Anjali Pawar', 'anjali.p@example.com', 'Cook', 7, 450, 'Expert in local and continental cuisine', 87, 1, 'Pune', 'Pune', 'Maharashtra', 'https://picsum.photos/seed/w7/200', '["Cooking", "Catering"]', '["Verified"]'],
      ['w8', 'worker', 'Vijay Thorat', 'vijay.t@example.com', 'Mason', 20, 900, 'Experienced in construction of rural homes', 94, 1, 'Solapur', 'Solapur', 'Maharashtra', 'https://picsum.photos/seed/w8/200', '["Construction", "Brickwork"]', '["Verified"]'],
      ['w9', 'worker', 'Meena Gaikwad', 'meena.g@example.com', 'Beautician', 3, 300, 'Bridal makeup and salon services', 80, 0, 'Aurangabad', 'Aurangabad', 'Maharashtra', 'https://picsum.photos/seed/w9/200', '["Makeup", "Hair Styling"]', '[]'],
      ['w10', 'worker', 'Rahul Varma', 'rahul.v@example.com', 'Welder', 6, 550, 'Precision welding for agricultural tools', 85, 1, 'Sangli', 'Sangli', 'Maharashtra', 'https://picsum.photos/seed/w10/200', '["Welding", "Fabrication"]', '["Verified"]']
    ];

    for (const w of workers) {
      await pool.query(`
        INSERT INTO users (uid, role, fullName, email, trade, experience, wage, bio, dakshScore, isVerified, city, district, state, photo, skills, badges)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, w);
    }

    // Insert 10 Jobs
    const jobs = [
      ['j1', 'demo-employer-id', 'Demo Employer', 'House Wiring Repair', 'Need urgent repair for home electrical circuit', 'Electrician', 1200, 'Pune', 'Pune', 'Maharashtra', 'active', null, '2 days'],
      ['j2', 'demo-employer-id', 'Demo Employer', 'Water Tank Leakage', 'Fixing leakage in terrace water tank', 'Plumber', 800, 'Pune', 'Pune', 'Maharashtra', 'active', null, '1 day'],
      ['j3', 'demo-employer-id', 'Demo Employer', 'Kitchen Cabinets', 'Building new wooden cabinets for kitchen', 'Carpenter', 5000, 'Kolhapur', 'Kolhapur', 'Maharashtra', 'active', null, '5 days'],
      ['j4', 'demo-employer-id', 'Demo Employer', 'Interior Painting', 'Painting 3 rooms with premium texture', 'Painter', 3000, 'Nashik', 'Nashik', 'Maharashtra', 'active', null, '3 days'],
      ['j5', 'demo-employer-id', 'Demo Employer', 'Wedding Catering', 'Need a lead cook for 50 people event', 'Cook', 2500, 'Pune', 'Pune', 'Maharashtra', 'active', null, '1 day'],
      ['j6', 'demo-employer-id', 'Demo Employer', 'Heavy Truck Driver', 'Looking for a driver for long distance transport', 'Driver', 1500, 'Nagpur', 'Nagpur', 'Maharashtra', 'active', null, '2 days'],
      ['j7', 'demo-employer-id', 'Demo Employer', 'Boundary Wall Const.', 'Building a 50ft boundary wall for field', 'Mason', 4000, 'Solapur', 'Solapur', 'Maharashtra', 'active', null, '4 days'],
      ['j8', 'demo-employer-id', 'Demo Employer', 'Bridal Makeup', 'Professional makeup needed for local wedding', 'Beautician', 1500, 'Aurangabad', 'Aurangabad', 'Maharashtra', 'active', null, '1 day'],
      ['j9', 'demo-employer-id', 'Demo Employer', 'Gate Welding', 'Repairing broken iron gate', 'Welder', 700, 'Sangli', 'Sangli', 'Maharashtra', 'active', null, '1 day'],
      ['j10', 'demo-employer-id', 'Demo Employer', 'School Uniforms', 'Stitching 20 pairs of school uniforms', 'Tailor', 2000, 'Satara', 'Satara', 'Maharashtra', 'active', null, '3 days']
    ];

    for (const j of jobs) {
      await pool.query(`
        INSERT INTO jobs (id, employerId, employerName, title, description, skillRequired, wage, city, district, state, status, confirmedWorkerId, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, j);
    }

    // Insert 10 Reviews/Ratings
    const reviews = [
      ['r1', 'w1', 'demo-employer-id', 'Demo Employer', 5, 'Excellent electrical work. Very professional and fast.'],
      ['r2', 'w2', 'demo-employer-id', 'Demo Employer', 4, 'Stitched uniforms were perfect. Great attention to detail.'],
      ['r3', 'w3', 'demo-employer-id', 'Demo Employer', 5, 'Fixed all leaks. Very polite and knowledgeable.'],
      ['r4', 'w4', 'demo-employer-id', 'Demo Employer', 5, 'The custom cabinets are beautiful. True craftsman!'],
      ['r5', 'w6', 'demo-employer-id', 'Demo Employer', 4, 'Safe driver and very punctual. Highly recommended.'],
      ['r6', 'w7', 'demo-employer-id', 'Demo Employer', 5, 'Food was delicious. All guests loved the traditional taste.'],
      ['r7', 'w8', 'demo-employer-id', 'Demo Employer', 5, 'Very strong construction work. Completed on time.'],
      ['r8', 'w10', 'demo-employer-id', 'Demo Employer', 4, 'Welding was precise and neat. Fixed our gate perfectly.'],
      ['r9', 'w1', 'demo-employer-id', 'Demo Employer', 5, 'Second time hiring Rajesh. Still the best electrician.'],
      ['r10', 'w3', 'demo-employer-id', 'Demo Employer', 3, 'Work was good, but arrived a bit late.']
    ];

    for (const r of reviews) {
      await pool.query(`
        INSERT INTO reviews (id, workerId, employerId, employerName, rating, comment)
        VALUES (?, ?, ?, ?, ?, ?)
      `, r);
    }

    console.log("Successfully added 10 workers, 10 jobs, and 10 reviews to the database!");
    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log("Successfully added 10 workers and 10 jobs to the database!");
    process.exit(0);
  } catch (error) {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
