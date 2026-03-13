import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout as firebaseLogout } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  signIn: () => Promise<void>;
  demoSignIn: (role: 'worker' | 'employer') => Promise<void>;
  signOut: () => Promise<void>;
  sendSMS: (message: string, phone: string) => void;
  smsNotification: { message: string, phone: string, visible: boolean } | null;
  closeSMS: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [smsNotification, setSmsNotification] = useState<{ message: string, phone: string, visible: boolean } | null>(null);

  const sendSMS = async (message: string, phone: string) => {
    // 1. Show UI Simulation instantly for best UX
    setSmsNotification({ message, phone, visible: true });
    
    // 2. Try real backend delivery
    try {
      const response = await fetch('http://localhost:3001/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message }),
        mode: 'cors'
      });
      if (!response.ok) {
        console.warn('SMS backend returned error:', await response.text());
      }
    } catch (error) {
      console.warn('Real SMS delivery failed, check your Twilio config in .env:', error);
    }

    // Auto-hide simulation after 8 seconds
    setTimeout(() => {
      setSmsNotification(prev => prev ? { ...prev, visible: false } : null);
    }, 8000);
  };

  const closeSMS = () => {
    setSmsNotification(prev => prev ? { ...prev, visible: false } : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleDemoSignIn = async (role: 'worker' | 'employer') => {
    setLoading(true);
    const mockUid = role === 'employer' ? 'demo-employer-id' : 'demo-worker-id';
    
    // Create a mock Firebase User-like object
    const mockUser = {
      uid: mockUid,
      displayName: role === 'employer' ? 'Demo Employer' : 'Demo Worker',
      email: `demo-${role}@example.com`,
      photoURL: `https://picsum.photos/seed/${mockUid}/200`
    } as User;

    // Create a mock profile
    const mockProfile: UserProfile = {
      uid: mockUid,
      displayName: role === 'employer' ? 'Demo Employer' : 'Demo Worker',
      fullName: role === 'employer' ? 'Demo Employer' : 'Demo Worker',
      email: mockUser.email || '',
      role: role,
      trade: role === 'worker' ? 'Electrician' : '',
      location: {
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        lat: 18.5204,
        lng: 73.8567
      },
      dakshScore: 85,
      isVerified: true,
      verified: true,
      bio: role === 'employer' ? 'Demo Employer Bio' : 'Professional Electrician with 5 years experience.',
      skills: role === 'worker' ? ['Wiring', 'Repair'] : [],
      experience: 5,
      wage: 500,
      photo: mockUser.photoURL || '',
      badges: ['Verified'],
      createdAt: new Date().toISOString()
    };

    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  const handleSignOut = async () => {
    if (user?.uid.includes('demo')) {
      setUser(null);
      setProfile(null);
    } else {
      await firebaseLogout();
    }
  };

  const value = {
    user,
    profile,
    loading,
    signingIn,
    signIn: handleSignIn,
    demoSignIn: handleDemoSignIn,
    signOut: handleSignOut,
    sendSMS,
    smsNotification,
    closeSMS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
