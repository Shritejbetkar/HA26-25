export type UserRole = 'worker' | 'employer' | 'admin';

export interface Location {
  city: string;
  district: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  uid: string;
  role: UserRole;
  displayName: string;
  fullName: string;
  email: string;
  photoURL?: string;
  photo: string;
  phoneNumber?: string;
  location: Location;
  trade: string;
  skills: string[];
  experience: number;
  wageExpectation?: number;
  wage: number;
  bio: string;
  dakshScore: number;
  isVerified: boolean;
  verified: boolean;
  badges: string[];
  rating?: number;
  reviewCount?: number;
  jobsApplied?: string[];
  jobsCompleted?: string[];
  jobsWorking?: string[];
  createdAt: any;
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  skillRequired: string;
  location: Location;
  duration: string;
  wage: number;
  wageType: 'daily' | 'fixed';
  paymentMode: 'cash' | 'online';
  paymentMethod?: string;
  status: 'active' | 'filled' | 'closed' | 'working' | 'completed';
  applicantsCount: number;
  confirmedWorkerId?: string;
  createdAt: any;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  workerName: string;
  jobTitle: string;
  status: 'pending' | 'accepted' | 'rejected' | 'hired';
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Review {
  id: string;
  workerId: string;
  employerId: string;
  employerName: string;
  rating: number;
  comment: string;
  createdAt: any;
}
