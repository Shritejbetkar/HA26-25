import { UserProfile, Job, Application, Review } from './types';

const API_BASE_URL = '/api';

/**
 * Fetch all users from the SQL database
 */
export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Fetch a specific user by UID from the SQL database
 */
export async function fetchUserById(uid: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${uid}:`, error);
    throw error;
  }
}

/**
 * Fetch all jobs from the SQL database
 */
export async function fetchJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

/**
 * Fetch applications for a specific worker
 */
export async function fetchApplicationsByWorker(workerId: string): Promise<Application[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/worker/${workerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching applications for worker ${workerId}:`, error);
    return [];
  }
}

/**
 * Fetch applications for a specific employer
 */
export async function fetchApplicationsByEmployer(employerId: string): Promise<Application[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/employer/${employerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching applications for employer ${employerId}:`, error);
    return [];
  }
}

/**
 * Update application status in SQL database
 */
export async function updateApplicationStatusInSQL(appId: string, status: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating application status for ${appId}:`, error);
    throw error;
  }
}

/**
 * Update job status in SQL database
 */
export async function updateJobStatusInSQL(jobId: string, status: string, confirmedWorkerId?: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, confirmedWorkerId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating job status for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Fetch reviews for a specific worker
 */
export async function fetchReviewsByWorker(workerId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/worker/${workerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching reviews for worker ${workerId}:`, error);
    return [];
  }
}

/**
 * Save a new user to the SQL database
 */
export async function saveUserToSQL(userData: UserProfile): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving user to SQL:', error);
    throw error;
  }
}

/**
 * Save a new job to the SQL database
 */
export async function saveJobToSQL(jobData: Job): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving job to SQL:', error);
    throw error;
  }
}

/**
 * Save a new application to the SQL database
 */
export async function saveApplicationToSQL(appData: Partial<Application>): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving application to SQL:', error);
    throw error;
  }
}

/**
 * Save a new review to the SQL database
 */
export async function saveReviewToSQL(reviewData: Partial<Review>): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving review to SQL:', error);
    throw error;
  }
}
