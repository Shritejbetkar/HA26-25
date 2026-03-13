import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, MapPin, Briefcase, IndianRupee, Clock, 
  ShieldCheck, Filter, ChevronRight, Navigation,
  Sparkles, MessageSquare, Star, CheckCircle2,
  X, Send, UserCheck, AlertTriangle, Mic, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_JOBS, TRADES_WITH_ICONS, TRADES } from '../constants';
import { Job, Application, UserProfile } from '../types';
import { 
  collection, onSnapshot, query, where, orderBy, 
  addDoc, updateDoc, doc, serverTimestamp, getDocs, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import BrowseWorkers from './BrowseWorkers';
import PostJob from './PostJob';
import { GoogleGenAI } from "@google/genai";
import { fetchUsers, fetchJobs, saveApplicationToSQL, fetchApplicationsByWorker } from '../api';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const JobBoard: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, sendSMS } = useAuth();
  const [activeTab, setActiveTab] = useState<'work' | 'hire' | 'post'>('work');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [zoom, setZoom] = useState(5);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [selectedJobForChat, setSelectedJobForChat] = useState<Job | null>(null);

  const trades = ['All', ...TRADES];

  useEffect(() => {
    const effectiveUid = user?.uid || 'demo-worker-id';
    
    // Load SQL applications first
    const loadSQLApps = async () => {
      try {
        const sqlApps = await fetchApplicationsByWorker(effectiveUid);
        setUserApplications(sqlApps);
      } catch (e) {
        console.warn('SQL applications fetch failed:', e);
      }
    };
    loadSQLApps();

    if (user) {
      const q = query(collection(db, 'applications'), where('workerId', '==', user.uid));
      let pollingInterval: any = null;

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fbApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        if (fbApps.length > 0) {
          setUserApplications(prev => {
            const combined = [...fbApps];
            prev.forEach(sa => {
              if (!combined.some(fa => fa.jobId === sa.jobId)) combined.push(sa);
            });
            return combined;
          });
        }
        if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, (error: any) => {
      if (error.code === 'permission-denied') return;

      console.warn('Firestore applications listener failed, falling back to polling:', error.message);
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const snapshot = await getDocs(q);
            const fbApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            if (fbApps.length > 0) {
              setUserApplications(prev => {
                const combined = [...fbApps];
                prev.forEach(sa => {
                  if (!combined.some(fa => fa.jobId === sa.jobId)) combined.push(sa);
                });
                return combined;
              });
            }
          } catch (e: any) {
            if (e.code !== 'permission-denied') {
              console.error("Polling fallback failed:", e);
            }
          }
        }, 15000); // Poll every 15 seconds for applications
      }
    });
      return () => {
        unsubscribe();
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [user]);

  useEffect(() => {
    // Initial fetch from SQL as baseline
    const loadInitialData = async () => {
      try {
        const sqlJobs = await fetchJobs();
        setJobs(sqlJobs.length > 0 ? sqlJobs : MOCK_JOBS as any);
        setLoading(false);
      } catch (e) {
        console.error('Initial SQL fetch failed:', e);
      }
    };
    loadInitialData();

    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    
    let pollingInterval: any = null;

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      // Try to merge with SQL jobs
      try {
        const sqlJobs = await fetchJobs();
        // Merge: Use SQL jobs that aren't in Firebase (if any)
        const firebaseIds = new Set(jobsData.map(j => j.id));
        const missingFromFirebase = sqlJobs.filter(sj => !firebaseIds.has(sj.id));
        jobsData = [...jobsData, ...missingFromFirebase];
      } catch (sqlError) {
        console.error('Error fetching jobs from SQL during sync:', sqlError);
      }

      setJobs(jobsData.length > 0 ? jobsData : MOCK_JOBS as any);
      setLoading(false);
      
      if (profile && jobsData.length > 0) {
        generateRecommendations(jobsData, profile);
      }

      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, (error) => {
      console.warn('Firestore jobs listener failed, falling back to polling:', error);
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const snapshot = await getDocs(q);
            let jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            const sqlJobs = await fetchJobs();
            const firebaseIds = new Set(jobsData.map(j => j.id));
            const missingFromFirebase = sqlJobs.filter(sj => !firebaseIds.has(sj.id));
            jobsData = [...jobsData, ...missingFromFirebase];
            setJobs(jobsData.length > 0 ? jobsData : MOCK_JOBS as any);
            setLoading(false);
          } catch (e) {}
        }, 20000); // Poll every 20 seconds for general jobs
      }
    });

    return () => {
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [profile]);

  const generateRecommendations = async (allJobs: Job[], userProfile: UserProfile) => {
    try {
      const API_KEY = process.env.GEMINI_API_KEY;
      if (!API_KEY) {
        console.warn("AI recommendation disabled: GEMINI_API_KEY is missing.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = `Given a worker with skills: ${userProfile.skills.join(', ')} and trade: ${userProfile.trade}. 
      And a list of jobs: ${JSON.stringify(allJobs.map(j => ({ id: j.id, title: j.title, skill: j.skillRequired })))}.
      Recommend the top 3 job IDs that match best. Return only a JSON array of IDs.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const recommendedIds = JSON.parse(response.text);
      const recs = allJobs.filter(j => recommendedIds.includes(j.id));
      setRecommendedJobs(recs);
    } catch (error) {
      console.error("Recommendation Error:", error);
    }
  };

  const handleApply = async (job: Job) => {
    // DEMO MODE: Use a default user if not signed in
    const effectiveUser = user || {
      uid: 'demo-worker-id',
      displayName: 'Demo Worker'
    };

    try {
      const applicationData = {
        jobId: job.id,
        workerId: effectiveUser.uid,
        employerId: job.employerId,
        workerName: profile?.fullName || effectiveUser.displayName || 'Anonymous',
        jobTitle: job.title,
        status: 'pending' as const
      };

      // Try Firebase
      try {
        await addDoc(collection(db, 'applications'), {
          ...applicationData,
          createdAt: serverTimestamp()
        });
      } catch (fbError) {
        console.warn('Firebase application failed (demo mode):', fbError);
      }

      // Save to SQL (Demo Mode)
      try {
        await saveApplicationToSQL({
          id: `app-${Date.now()}`,
          ...applicationData,
          createdAt: new Date().toISOString()
        } as any);
      } catch (sqlError) {
        console.warn('Failed to save application to SQL:', sqlError);
      }

      const jobRef = doc(db, 'jobs', job.id);
      try {
        await updateDoc(jobRef, {
          applicantsCount: (job.applicantsCount || 0) + 1
        });
      } catch (e) {}

      setShowSuccessPopup(true);
      // Real-time simulated SMS
      sendSMS(`New applicant for your job "${job.title}": ${profile?.fullName || user.displayName}. Open Daksh-Bharat to review.`, "Employer");
      console.log(`SMS to ${job.employerName}: New worker applied for your job: ${job.title}. Please review the applicant.`);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    }
  };

  const getTradeIcon = (tradeName: string) => {
    const trade = TRADES_WITH_ICONS.find(t => t.name === tradeName);
    return trade ? trade.icon : '💼';
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrade = selectedTrade === 'All' || job.skillRequired === selectedTrade;
    return matchesSearch && matchesTrade;
  });

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-bg">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 bg-secondary/50 px-6 pt-4">
        <button 
          onClick={() => setActiveTab('work')}
          className={`px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'work' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          I Want to Work
        </button>
        <button 
          onClick={() => setActiveTab('hire')}
          className={`px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'hire' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          I Want to Hire
        </button>
        <button 
          onClick={() => setActiveTab('post')}
          className={`px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'post' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Create a Job
        </button>
      </div>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {activeTab === 'work' && (
          <>
            {/* Sidebar - Job List */}
            <div className="w-full md:w-1/2 h-full flex flex-col border-r border-border bg-bg">
              <div className="p-6 border-b border-border space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-display font-bold text-white">Find <span className="text-primary">Work</span></h1>
                  <button 
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                          setZoom(12);
                        });
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-bold hover:bg-primary/30 transition-all"
                  >
                    <Navigation className="h-4 w-4 mr-2" /> {t('jobs.near_me')}
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder={t('jobs.search_placeholder')}
                      className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <select
                      className="bg-card border border-border rounded-xl py-3 pl-10 pr-8 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                      value={selectedTrade}
                      onChange={(e) => setSelectedTrade(e.target.value)}
                    >
                      <option value="All">{t('jobs.filter_all')}</option>
                      {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* AI Recommendations */}
                {recommendedJobs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recommended For You</h2>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
                      {recommendedJobs.map(job => (
                        <motion.div
                          key={`rec-${job.id}`}
                          whileHover={{ y: -5 }}
                          className="min-w-[280px] glass p-4 rounded-2xl border-primary/30"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl">{getTradeIcon(job.skillRequired)}</span>
                            <span className="text-accent font-bold">₹{job.wage}</span>
                          </div>
                          <h3 className="text-white font-bold truncate">{job.title}</h3>
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-gray-500">{job.location.city}</p>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center ${
                              job.paymentMode === 'online' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {job.paymentMode === 'online' ? 'Online' : 'Cash'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleApply(job)}
                            className="w-full py-2 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary transition-all hover:text-white"
                          >
                            Quick Apply
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Briefcase className="h-10 w-10 text-primary" />
                    </motion.div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job, idx) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="glass p-6 rounded-2xl group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => job.location?.lat && setMapCenter([job.location.lat, job.location.lng!])}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                                {getTradeIcon(job.skillRequired)}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{job.title}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    {job.skillRequired}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center ${
                                    job.paymentMode === 'online' 
                                      ? 'bg-green-500/10 text-green-500' 
                                      : 'bg-orange-500/10 text-orange-500'
                                  }`}>
                                    {job.paymentMode === 'online' ? (
                                      <><CheckCircle2 className="h-2 w-2 mr-1" /> Online</>
                                    ) : (
                                      <><CreditCard className="h-2 w-2 mr-1" /> Cash</>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-display font-bold text-accent">₹{job.wage}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Fixed Budget</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center text-gray-400 text-xs">
                              <MapPin className="h-3 w-3 mr-2 text-primary" />
                              {job.location?.city || 'Location not set'}
                            </div>
                            <div className="flex items-center text-gray-400 text-xs">
                              <Clock className="h-3 w-3 mr-2 text-primary" />
                              {job.duration}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {(job.employerName || 'A').charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs text-white font-bold flex items-center">
                                  {job.employerName || 'Anonymous'} <ShieldCheck className="h-3 w-3 ml-1 text-primary" />
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Verified Employer</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJobForChat(job);
                                }}
                                className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-all"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApply(job);
                                }}
                                disabled={userApplications.some(app => app.jobId === job.id)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all ${
                                  userApplications.some(app => app.jobId === job.id && app.status === 'hired')
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : userApplications.some(app => app.jobId === job.id)
                                      ? 'bg-gray-600 cursor-not-allowed'
                                      : 'btn-saffron'
                                }`}
                              >
                                {userApplications.some(app => app.jobId === job.id && app.status === 'hired')
                                  ? 'User Confirmed!'
                                  : userApplications.some(app => app.jobId === job.id)
                                    ? 'Applied'
                                    : 'Apply Now'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-20">
                        <Briefcase className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No jobs found</h3>
                      </div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="hidden md:block w-1/2 h-full relative z-0">
              <MapContainer center={mapCenter} zoom={zoom} className="h-full w-full">
                <TileLayer 
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapUpdater center={mapCenter} zoom={zoom} />
                {filteredJobs.map(job => (
                  job.location.lat && (
                    <Marker key={job.id} position={[job.location.lat, job.location.lng!]}>
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-secondary">{job.title}</h4>
                          <p className="text-primary font-bold">₹{job.wage}</p>
                          <button onClick={() => handleApply(job)} className="mt-2 w-full bg-primary text-white text-xs py-1 rounded font-bold">Apply</button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </>
        )}

        {activeTab === 'hire' && <BrowseWorkers />}
        {activeTab === 'post' && <PostJob />}
      </div>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass p-8 rounded-3xl text-center max-w-sm w-full border-primary/30"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Application Sent!</h2>
              <p className="text-gray-400 mb-6 text-sm">The employer has been notified via SMS. You'll hear back soon.</p>
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold"
              >
                Great!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {selectedJobForChat && (
          <ChatModal 
            job={selectedJobForChat} 
            onClose={() => setSelectedJobForChat(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatModal: React.FC<{ job: Job, onClose: () => void }> = ({ job, onClose }) => {
  const { user } = useAuth();
  const [firestoreMessages, setFirestoreMessages] = useState<any[]>([]);
  const [demoMessages, setDemoMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Effective UID for sending/receiving
  const currentUid = user?.uid || 'demo-worker-id';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [firestoreMessages, demoMessages]);

  useEffect(() => {
    // Initial welcome message for demo jobs
    if (job.employerId === 'demo-employer-id' || job.employerId.includes('demo')) {
      setDemoMessages([{
        senderId: job.employerId,
        text: `Hello! Thanks for your interest in the "${job.title}" position. How can I help you?`,
        createdAt: new Date()
      }]);
    }

    // If we're in a pure demo mode (no real user), don't even try Firestore to avoid permission errors
    if (!user && (job.employerId === 'demo-employer-id' || job.employerId.includes('demo'))) {
      return;
    }

    const q = query(
      collection(db, 'chats'), 
      where('jobId', '==', job.id),
      orderBy('createdAt', 'asc')
    );

    let pollingInterval: any = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreMessages(msgs);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, (error) => {
      // Suppress permission errors in demo/local development to reduce console noise
      if (error.code === 'permission-denied') {
        return;
      }
      
      console.warn('Firestore chats listener failed, falling back to polling:', error.message);
      // Fallback: Poll every 5 seconds if the real-time listener fails
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const snapshot = await getDocs(q);
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFirestoreMessages(msgs);
          } catch (e: any) {
            if (e.code !== 'permission-denied') {
              console.error("Polling fallback failed:", e);
            }
          }
        }, 5000);
      }
    });

    return () => {
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [job.id, job.employerId, job.title]);

  // Combine both sources
   const allMessages = [...firestoreMessages, ...demoMessages].sort((a, b) => {
     const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date());
     const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date());
     return (timeA as any) - (timeB as any);
   });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const text = newMessage.trim();
    setNewMessage('');

    const msgObj = {
      jobId: job.id,
      senderId: currentUid,
      text: text,
      createdAt: new Date()
    };
    
    // Add to demo messages for instant local feedback
    setDemoMessages(prev => [...prev, msgObj]);

    // 1. Try Firestore only if not in pure demo mode
    if (user && !job.employerId.includes('demo')) {
      try {
        await addDoc(collection(db, 'chats'), {
          ...msgObj,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore chat save failed:', err);
      }
    }

    // 2. Demo Auto-reply
    if (job.employerId === 'demo-employer-id' || job.employerId.includes('demo')) {
      setTimeout(() => {
        setDemoMessages(prev => [...prev, {
          jobId: job.id,
          senderId: job.employerId,
          text: "I have received your message. I'm currently away but I'll check your profile and get back to you shortly!",
          createdAt: new Date()
        }]);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="glass w-full max-w-lg h-[600px] rounded-3xl flex flex-col overflow-hidden border-white/10"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
              💬
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{job.title}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Chat with {job.employerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {allMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.senderId === currentUid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.senderId === currentUid ? 'bg-primary text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5 flex items-center space-x-2">
          <input 
            type="text"
            placeholder="Type a message..."
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-primary"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" className="p-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export default JobBoard;
