import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Filter, IndianRupee, Star, 
  ShieldCheck, ChevronRight, Hammer, MessageCircle, 
  List, Map as MapIcon, Sparkles, CheckCircle2,
  UserCheck, Award, Briefcase, History, Phone,
  Mail, Calendar, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_WORKERS, TRADES_WITH_ICONS, TRADES } from '../constants';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Job } from '../types';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { fetchUsers } from '../api';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const WorkerCard: React.FC<{ worker: UserProfile, isConfirmed?: boolean }> = ({ worker, isConfirmed }) => {
  const { t } = useTranslation();
  
  const getTradeIcon = (tradeName: string) => {
    const trade = TRADES_WITH_ICONS.find(t => t.name === tradeName);
    return trade ? trade.icon : '💼';
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (worker.phoneNumber) {
      const url = `https://wa.me/91${worker.phoneNumber}?text=Hello ${worker.fullName}, I found your profile on Daksh-Bharat and would like to discuss a job opportunity.`;
      window.open(url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 rounded-3xl border-white/5 hover:border-primary/30 transition-all group hover:-translate-y-1 relative overflow-hidden"
    >
      {isConfirmed && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl flex items-center">
          <UserCheck className="h-3 w-3 mr-1" /> User Confirmed!
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={worker.photo || `https://picsum.photos/seed/${worker.uid}/200`} 
              alt={worker.fullName} 
              className="h-16 w-16 rounded-2xl object-cover border border-white/10"
              referrerPolicy="no-referrer"
            />
            {worker.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-2 border-card">
                <ShieldCheck className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors">{worker.fullName}</h4>
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-primary" /> {worker.location?.district || 'No location set'}
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-display font-bold ${worker.dakshScore > 70 ? 'text-green-500' : 'text-accent'}`}>{worker.dakshScore}</div>
          <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Daksh Score</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center">
          <span className="mr-2">{getTradeIcon(worker.trade)}</span> {worker.trade}
        </span>
        <span className="text-xs text-gray-500 font-bold">{worker.experience} yrs exp.</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {worker.skills?.slice(0, 3).map((s: string) => (
          <span key={s} className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">
            {s}
          </span>
        ))}
        {(worker.skills?.length || 0) > 3 && (
          <span className="text-[10px] text-gray-600 px-2 py-1">+{(worker.skills?.length || 0) - 3} more</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div>
          <p className="text-lg font-display font-bold text-accent">₹{worker.wage}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold">per day</p>
        </div>
        <div className="flex space-x-2">
          {worker.phoneNumber && (
            <button 
              onClick={openWhatsApp}
              className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
          <Link to={`/worker/${worker.uid}`} className="btn-saffron px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center">
            View Profile <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const BrowseWorkers: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [recommendedWorkers, setRecommendedWorkers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Initial fetch from SQL as baseline
    const loadInitialData = async () => {
      try {
        const sqlUsers = await fetchUsers();
        const sqlWorkers = sqlUsers.filter(u => u.role === 'worker');
        setWorkers(sqlWorkers.length > 0 ? sqlWorkers : MOCK_WORKERS as any);
        setLoading(false);
      } catch (e) {
        console.error('Initial SQL fetch failed:', e);
      }
    };
    loadInitialData();

    const q = query(collection(db, 'users'), where('role', '==', 'worker'));
    
    let pollingInterval: any = null;

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let workersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      // Try to merge with SQL users
      try {
        const sqlUsers = await fetchUsers();
        const sqlWorkers = sqlUsers.filter(u => u.role === 'worker');
        const firebaseUids = new Set(workersData.map(w => w.uid));
        const missingFromFirebase = sqlWorkers.filter(sw => !firebaseUids.has(sw.uid));
        workersData = [...workersData, ...missingFromFirebase];
      } catch (sqlError) {
        console.error('Error fetching workers from SQL during sync:', sqlError);
      }

      setWorkers(workersData.length > 0 ? workersData : MOCK_WORKERS as any);
      setLoading(false);

      if (profile?.role === 'employer') {
        generateRecommendations(workersData);
      }

      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, (error: any) => {
      // Suppress permission errors in demo mode
      if (error.code === 'permission-denied') return;

      console.warn('Firestore workers listener failed, falling back to polling:', error.message);
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const snapshot = await getDocs(q);
            let workersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            const sqlUsers = await fetchUsers();
            const sqlWorkers = sqlUsers.filter(u => u.role === 'worker');
            const firebaseUids = new Set(workersData.map(w => w.uid));
            const missingFromFirebase = sqlWorkers.filter(sw => !firebaseUids.has(sw.uid));
            workersData = [...workersData, ...missingFromFirebase];
            setWorkers(workersData.length > 0 ? workersData : MOCK_WORKERS as any);
            setLoading(false);
          } catch (e: any) {
            if (e.code !== 'permission-denied') {
              console.error("Polling fallback failed:", e);
            }
          }
        }, 30000); // Poll every 30 seconds for workers list
      }
    });

    return () => {
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [profile]);

  const generateRecommendations = async (allWorkers: UserProfile[]) => {
    try {
      // For employers, recommend workers based on their recent job posts
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('employerId', '==', user?.uid)));
      const employerJobs = jobsSnap.docs.map(d => d.data() as Job);
      
      if (employerJobs.length === 0) return;

      const API_KEY = process.env.GEMINI_API_KEY;
      if (!API_KEY) {
        console.warn("AI recommendation disabled: GEMINI_API_KEY is missing.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = `Given an employer who posted jobs: ${JSON.stringify(employerJobs.map(j => j.title))}.
      And a list of workers: ${JSON.stringify(allWorkers.map(w => ({ uid: w.uid, trade: w.trade, skills: w.skills })))}.
      Recommend the top 3 worker UIDs that match best. Return only a JSON array of UIDs.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const recommendedIds = JSON.parse(response.text);
      const recs = allWorkers.filter(w => recommendedIds.includes(w.uid));
      setRecommendedWorkers(recs);
    } catch (error) {
      console.error("Worker Recommendation Error:", error);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         worker.trade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrade = selectedTrade === 'All' || worker.trade === selectedTrade;
    const matchesScore = worker.dakshScore >= minScore;
    return matchesSearch && matchesTrade && matchesScore;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Browse <span className="text-primary">Workers</span></h1>
          <p className="text-gray-400">Find verified local talent with high Daksh Scores.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <div className="flex bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="h-4 w-4 mr-2" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <MapIcon className="h-4 w-4 mr-2" /> Map
            </button>
          </div>
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or trade..."
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* AI Recommendations for Employers */}
      {recommendedWorkers.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Recommended Workers For You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedWorkers.map(worker => (
              <WorkerCard key={`rec-${worker.uid}`} worker={worker} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-8 rounded-3xl border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-primary" /> Filters
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trade Category</label>
                <div className="space-y-2">
                  {['All', ...TRADES].map(trade => (
                    <button
                      key={trade}
                      onClick={() => setSelectedTrade(trade)}
                      className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                        selectedTrade === trade 
                        ? 'bg-primary/20 text-primary font-bold border border-primary/30' 
                        : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {trade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Daksh Score</label>
                  <span className="text-primary font-bold">{minScore}</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5"
                  className="w-full accent-primary"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid / Map */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Hammer className="h-12 w-12 text-primary" />
              </motion.div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map(worker => (
                    <WorkerCard key={worker.uid} worker={worker} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 glass rounded-3xl border-dashed border-border">
                    <Hammer className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-500">No workers found</h3>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-[600px] rounded-3xl overflow-hidden border border-white/10 glass">
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer 
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredWorkers.filter(w => w.location.lat && w.location.lng).map(worker => (
                  <Marker key={worker.uid} position={[worker.location.lat!, worker.location.lng!]}>
                    <Popup className="custom-popup">
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center space-x-3 mb-3">
                          <img src={worker.photo} alt={worker.fullName} className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="font-bold text-secondary leading-tight">{worker.fullName}</h4>
                            <p className="text-[10px] text-primary font-bold uppercase">{worker.trade}</p>
                          </div>
                        </div>
                        <Link to={`/worker/${worker.uid}`} className="w-full flex items-center justify-center py-2 rounded-lg bg-primary text-white text-[10px] font-bold">
                          View Profile
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseWorkers;
