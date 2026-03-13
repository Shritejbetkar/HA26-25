import mysql from 'mysql2/promise';
import 'dotenv/config';

// Create the connection pool.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daksh_bharat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database schema
export const initDb = async () => {
  try {
    // Drop tables to clear old foreign key constraints (temporary for schema update)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DROP TABLE IF EXISTS reviews, applications, jobs, users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        trade VARCHAR(100),
        experience INTEGER DEFAULT 0,
        wage INTEGER DEFAULT 0,
        bio TEXT,
        dakshScore INTEGER DEFAULT 0,
        isVerified TINYINT(1) DEFAULT 0,
        city VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        photo TEXT,
        skills TEXT,
        badges TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(255) PRIMARY KEY,
        employerId VARCHAR(255) NOT NULL,
        employerName VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        skillRequired VARCHAR(255),
        wage INTEGER NOT NULL,
        city VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        confirmedWorkerId VARCHAR(255),
        duration VARCHAR(100),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const createApplicationsTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(255) PRIMARY KEY,
        jobId VARCHAR(255) NOT NULL,
        workerId VARCHAR(255) NOT NULL,
        employerId VARCHAR(255) NOT NULL,
        workerName VARCHAR(255),
        jobTitle VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        workerId VARCHAR(255) NOT NULL,
        employerId VARCHAR(255) NOT NULL,
        employerName VARCHAR(255),
        rating INTEGER NOT NULL,
        comment TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createUsersTable);
    await pool.query(createJobsTable);
    await pool.query(createApplicationsTable);
    await pool.query(createReviewsTable);
    
    console.log('Database initialized successfully (MySQL).');
  } catch (error) {
    console.error('Error initializing MySQL database:', error.message);
    console.log('NOTE: Make sure you created the database "' + (process.env.DB_NAME || 'daksh_bharat') + '" in phpMyAdmin/MySQL first.');
  }
};

// Data access helper methods
const mapUserRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        location: {
            city: row.city,
            district: row.district,
            state: row.state
        },
        skills: row.skills ? JSON.parse(row.skills) : [],
        badges: row.badges ? JSON.parse(row.badges) : [],
        isVerified: !!row.isVerified,
        verified: !!row.isVerified
    };
};

const mapJobRow = (row) => {
    if (!row) return null;
    return {
        ...row,
        location: {
            city: row.city,
            district: row.district,
            state: row.state,
            lat: row.lat || 20.5937,
            lng: row.lng || 78.9629
        }
    };
};

export const getUsers = async () => {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows.map(mapUserRow);
};

export const getUserById = async (uid) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE uid = ?', [uid]);
    return mapUserRow(rows[0]);
};

export const getJobs = async () => {
    const [rows] = await pool.query(`
        SELECT jobs.*, users.fullName as employerName 
        FROM jobs 
        LEFT JOIN users ON jobs.employerId = users.uid
    `);
    return rows.map(mapJobRow);
};

export const getApplicationsByWorker = async (workerId) => {
    const [rows] = await pool.query('SELECT * FROM applications WHERE workerId = ?', [workerId]);
    return rows;
};

export const getApplicationsByEmployer = async (employerId) => {
    const [rows] = await pool.query('SELECT * FROM applications WHERE employerId = ?', [employerId]);
    return rows;
};

export const updateApplicationStatus = async (appId, status) => {
    const [result] = await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, appId]);
    return result;
};

export const getReviewsByWorker = async (workerId) => {
    const [rows] = await pool.query('SELECT * FROM reviews WHERE workerId = ?', [workerId]);
    return rows;
};

export const createUser = async (userData) => {
    const { 
        uid, role, fullName, email, trade, experience, wage, bio, 
        dakshScore, isVerified, location, photo, skills, badges 
    } = userData;
    const { city, district, state } = location || {};
    
    const query = `
        INSERT INTO users (
            uid, role, fullName, email, trade, experience, wage, bio, 
            dakshScore, isVerified, city, district, state, photo, skills, badges
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            role = VALUES(role),
            fullName = VALUES(fullName),
            email = VALUES(email),
            trade = VALUES(trade),
            experience = VALUES(experience),
            wage = VALUES(wage),
            bio = VALUES(bio),
            dakshScore = VALUES(dakshScore),
            isVerified = VALUES(isVerified),
            city = VALUES(city),
            district = VALUES(district),
            state = VALUES(state),
            photo = VALUES(photo),
            skills = VALUES(skills),
            badges = VALUES(badges)
    `;
    
    const verifiedInt = (isVerified === true || isVerified === 1) ? 1 : 0;
    const skillsStr = JSON.stringify(skills || []);
    const badgesStr = JSON.stringify(badges || []);
    
    const [result] = await pool.query(query, [
        uid, role, fullName, email, trade || null, experience || 0, 
        wage || 0, bio || null, dakshScore || 0, verifiedInt,
        city || null, district || null, state || null, 
        photo || null, skillsStr, badgesStr
    ]);
    return result;
};

export const createJob = async (jobData) => {
    const { 
        id, employerId, employerName, title, description, skillRequired, 
        wage, location, status, confirmedWorkerId, duration 
    } = jobData;
    const { city, district, state } = location || {};
    
    const query = `
        INSERT INTO jobs (
            id, employerId, employerName, title, description, skillRequired, 
            wage, city, district, state, status, confirmedWorkerId, duration
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            employerName = VALUES(employerName),
            title = VALUES(title),
            description = VALUES(description),
            skillRequired = VALUES(skillRequired),
            wage = VALUES(wage),
            city = VALUES(city),
            district = VALUES(district),
            state = VALUES(state),
            status = VALUES(status),
            confirmedWorkerId = VALUES(confirmedWorkerId),
            duration = VALUES(duration)
    `;
    
    const [result] = await pool.query(query, [
        id || `job-${Date.now()}`, employerId, employerName || 'Anonymous', title, description || null, 
        skillRequired || null, wage || 0, city || null, district || null, 
        state || null, status || 'active', confirmedWorkerId || null, 
        duration || 'Full Time'
    ]);
    return result;
};

export const updateJobStatus = async (jobId, status, confirmedWorkerId = null) => {
    const [result] = await pool.query('UPDATE jobs SET status = ?, confirmedWorkerId = ? WHERE id = ?', [status, confirmedWorkerId, jobId]);
    return result;
};

export const createApplication = async (appData) => {
    const { id, jobId, workerId, employerId, workerName, jobTitle, status } = appData;
    
    // Validate required fields for MySQL foreign keys
    if (!jobId || !workerId || !employerId) {
        throw new Error('Missing required fields: jobId, workerId, and employerId are required.');
    }

    const query = `
        INSERT INTO applications (id, jobId, workerId, employerId, workerName, jobTitle, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            workerName = VALUES(workerName),
            jobTitle = VALUES(jobTitle),
            status = VALUES(status)
    `;
    const [result] = await pool.query(query, [id || `app-${Date.now()}`, jobId, workerId, employerId, workerName, jobTitle, status || 'pending']);
    return result;
};

export const createReview = async (reviewData) => {
    const { id, workerId, employerId, employerName, rating, comment } = reviewData;
    const query = `
        INSERT INTO reviews (id, workerId, employerId, employerName, rating, comment)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            employerName = VALUES(employerName),
            rating = VALUES(rating),
            comment = VALUES(comment)
    `;
    const [result] = await pool.query(query, [id || `rev-${Date.now()}`, workerId, employerId, employerName, rating, comment]);
    return result;
};

export const searchJobs = async (criteria) => {
    const { title, trade, city } = criteria;
    let sql = `
        SELECT jobs.*, users.fullName as employerName 
        FROM jobs 
        LEFT JOIN users ON jobs.employerId = users.uid 
        WHERE jobs.status = 'active'
    `;
    const params = [];

    if (title) {
        sql += ' AND jobs.title LIKE ?';
        params.push(`%${title}%`);
    }
    if (trade) {
        sql += ' AND jobs.skillRequired LIKE ?';
        params.push(`%${trade}%`);
    }
    if (city) {
        sql += ' AND jobs.city LIKE ?';
        params.push(`%${city}%`);
    }

    const [rows] = await pool.query(sql, params);
    return rows.map(mapJobRow);
};

export default pool;
