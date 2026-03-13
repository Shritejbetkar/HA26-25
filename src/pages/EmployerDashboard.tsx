import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Briefcase, Star, CheckCircle, Clock, MapPin, IndianRupee, ChevronRight, X, Star as StarIcon, CreditCard, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MOCK_WORKERS, TRADES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Job, UserProfile, Application, Review } from '../types';
import { 
  fetchJobs, 
  saveJobToSQL, 
  fetchApplicationsByEmployer, 
  updateApplicationStatusInSQL, 
  updateJobStatusInSQL,
  saveReviewToSQL,
  fetchUserById
} from '../api';

const EmployerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showUPIDialog, setShowUPIDialog] = useState(false);
  const [activeUPIId, setActiveUPIId] = useState<string | null>(null);
  const [activeWorkerName, setActiveWorkerName] = useState<string | null>(null);
  const [activeAmount, setActiveAmount] = useState<number | null>(null);
  
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<UserProfile[]>([]);
  const [hiredWorkers, setHiredWorkers] = useState<UserProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    skillRequired: TRADES[0],
    location: '',
    duration: '',
    wage: 800,
    description: ''
  });

  useEffect(() => {
    if (!user) return;

    // Load initial data from SQL first (Demo Mode Baseline)
    const loadSQLData = async () => {
      try {
        const sqlJobs = await fetchJobs();
        const employerJobs = sqlJobs.filter(j => j.employerId === user.uid || j.employerId === 'demo-employer-id');
        setMyJobs(employerJobs);
      } catch (e) {
        console.warn('SQL fetch failed for employer jobs:', e);
      }
    };
    loadSQLData();

    // Then subscribe to Firestore updates
    const q = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
    
    let pollingInterval: any = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      if (jobsData.length > 0) {
        setMyJobs(prev => {
          // Merge Firestore jobs with SQL jobs, prioritizing Firestore
          const combined = [...jobsData];
          prev.forEach(sj => {
            if (!combined.some(fj => fj.id === sj.id)) combined.push(sj);
          });
          return combined;
        });
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, (error: any) => {
      // Suppress common demo mode errors
      if (error.code === 'permission-denied') return;

      console.warn('Firestore jobs listener failed, falling back to polling:', error.message);
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const snapshot = await getDocs(q);
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            if (jobsData.length > 0) {
              setMyJobs(prev => {
                const combined = [...jobsData];
                prev.forEach(sj => {
                  if (!combined.some(fj => fj.id === sj.id)) combined.push(sj);
                });
                return combined;
              });
            }
          } catch (e: any) {
            if (e.code !== 'permission-denied') {
              console.error("Polling fallback failed:", e);
            }
          }
        }, 10000); // Poll every 10 seconds for jobs
      }
    });

    return () => {
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [user]);

  const stats = [
    { label: 'Active Job Posts', value: myJobs.filter(j => j.status === 'active').length.toString(), icon: Briefcase, color: 'text-primary' },
    { label: 'Total Applicants', value: myJobs.reduce((acc, j) => acc + (j.applicantsCount || 0), 0).toString(), icon: Users, color: 'text-accent' },
    { label: 'Workers Hired', value: hiredWorkers.length.toString(), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Avg Rating Given', value: '4.6★', icon: Star, color: 'text-yellow-500' },
  ];

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUid = user?.uid || 'demo-employer-id';

    setIsSubmitting(true);
    try {
      const jobData: any = {
        employerId: currentUid,
        employerName: profile?.fullName || user?.displayName || 'Demo Employer',
        title: newJob.title,
        skillRequired: newJob.skillRequired,
        description: newJob.description,
        location: {
          city: newJob.location,
          district: newJob.location,
          state: 'Maharashtra',
          lat: 20.5937,
          lng: 78.9629
        },
        duration: newJob.duration,
        wage: Number(newJob.wage),
        wageType: 'daily',
        status: 'active',
        applicantsCount: 0,
        createdAt: new Date().toISOString()
      };

      // 1. Try Firestore
      try {
        await addDoc(collection(db, 'jobs'), jobData);
      } catch (fError) {
        console.warn('Firebase job post failed, falling back to SQL only:', fError);
      }

      // 2. Always save to SQL for demo consistency
      await saveJobToSQL({
        id: `job-${Date.now()}`,
        ...jobData
      });

      toast.success('Job posted successfully!');
      setShowPostJob(false);
      setNewJob({
        title: '',
        skillRequired: TRADES[0],
        location: '',
        duration: '',
        wage: 800,
        description: ''
      });
      
      // Refresh job list
      const updatedJobs = await fetchJobs();
      setMyJobs(updatedJobs.filter(j => j.employerId === currentUid));

    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchApplicants = async (jobId: string) => {
    setSelectedJobId(jobId);
    setIsSubmitting(true);
    try {
      let workerIds: string[] = [];
      
      // 1. Try Firestore
      try {
        const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
        const snapshot = await getDocs(q);
        workerIds = snapshot.docs.map(doc => doc.data().workerId);
      } catch (fError) {
        console.warn('Firebase applications fetch failed, trying SQL:', fError);
      }

      // 2. Try SQL if Firestore was empty or failed
      if (workerIds.length === 0) {
        const sqlApps = await fetchApplicationsByEmployer(user?.uid || 'demo-employer-id');
        workerIds = sqlApps.filter(app => app.jobId === jobId).map(app => app.workerId);
      }

      if (workerIds.length === 0) {
        setApplicants([]);
        setShowApplicants(true);
        return;
      }

      // Fetch worker profiles for these IDs
      const workersData: UserProfile[] = [];
      for (const uid of workerIds) {
        // Try Firebase first
        try {
          const workerDoc = await getDoc(doc(db, 'users', uid));
          if (workerDoc.exists()) {
            workersData.push({ uid: workerDoc.id, ...workerDoc.data() } as UserProfile);
            continue;
          }
        } catch (e) {}

        // Fallback to SQL for worker details
        const sqlWorker = await fetchUserById(uid);
        if (sqlWorker) {
          workersData.push(sqlWorker);
        }
      }
      
      setApplicants(workersData);
      setShowApplicants(true);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast.error('Failed to load applicants');
      setApplicants(MOCK_WORKERS as UserProfile[]);
      setShowApplicants(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHire = async (worker: UserProfile) => {
    if (!selectedJobId) return;
    
    try {
      // 1. Update application status in Firestore (if possible)
      try {
        const q = query(
          collection(db, 'applications'), 
          where('jobId', '==', selectedJobId),
          where('workerId', '==', worker.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const appDoc = snapshot.docs[0];
          await updateDoc(doc(db, 'applications', appDoc.id), {
            status: 'hired',
            hiredAt: serverTimestamp()
          });
        }
      } catch (fError) {
        console.warn('Firebase application update failed:', fError);
      }

      // 2. Update status in SQL (Critical for Demo Mode)
      try {
        // We need to find the SQL application ID. For now, let's assume we can update by status if we had the ID.
        // Or better, let's just update the job status to 'working' in SQL.
        await updateJobStatusInSQL(selectedJobId, 'working', worker.uid);
        
        // Find all apps for this job and worker to update their status in SQL
        const apps = await fetchApplicationsByEmployer(user?.uid || 'demo-employer-id');
        const targetApp = apps.find(a => a.jobId === selectedJobId && a.workerId === worker.uid);
        if (targetApp?.id) {
          await updateApplicationStatusInSQL(targetApp.id, 'hired');
        }
      } catch (sqlError) {
        console.warn('SQL application update failed:', sqlError);
      }

      toast.success(`Hired ${worker.fullName}!`);
      setHiredWorkers([...hiredWorkers, worker]);
      setShowApplicants(false);
      
      // Refresh jobs to show 'working' status
      const updatedJobs = await fetchJobs();
      setMyJobs(updatedJobs.filter(j => j.employerId === (user?.uid || 'demo-employer-id')));

    } catch (error) {
      console.error('Error hiring worker:', error);
      toast.error('Failed to hire worker');
    }
  };

  const handleComplete = async () => {
    if (!selectedWorker) return;
    
    // Check if job had online payment mode and if worker has a UPI ID
    // Note: In a real app, this would be fetched from the DB
    const job = myJobs.find(j => j.id === selectedJobId);
    const workerUPI = (selectedWorker as any).upiId || 'demo@upi'; // Fallback for demo

    if (job?.paymentMode === 'online') {
      setActiveUPIId(workerUPI);
      setActiveWorkerName(selectedWorker.fullName);
      setActiveAmount(job.wage);
      setShowUPIDialog(true);
    } else {
      await processCompletion();
    }
  };

  const processCompletion = async () => {
    if (!selectedWorker) return;
    
    try {
      const reviewData: any = {
        workerId: selectedWorker.uid,
        employerId: user?.uid || 'demo-employer-id',
        employerName: profile?.fullName || user?.displayName || 'Demo Employer',
        rating: rating,
        comment: reviewText,
        createdAt: new Date().toISOString()
      };

      // 1. Add review to Firestore
      try {
        await addDoc(collection(db, 'reviews'), reviewData);
      } catch (fError) {
        console.warn('Firebase review submission failed:', fError);
      }

      // 2. Save to SQL (Critical for Demo Mode)
      await saveReviewToSQL(reviewData);

      toast.success('Job completed successfully!');
      setShowRatingModal(false);
      setShowUPIDialog(false);
      setRating(0);
      setReviewText('');
      
      // If there's an active job being completed, update its status
      if (selectedJobId) {
        await updateJobStatusInSQL(selectedJobId, 'completed', selectedWorker.uid);
      }

      // Refresh hired workers list to remove the completed one
      setHiredWorkers(prev => prev.filter(w => w.uid !== selectedWorker.uid));

    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to submit rating');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white">Employer Dashboard</h1>
        <button 
          onClick={() => setShowPostJob(!showPostJob)}
          className="btn-saffron px-6 py-3 rounded-xl font-bold text-white flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" /> Post New Job
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-2xl border-white/5"
          >
            <stat.icon className={`h-6 w-6 ${stat.color} mb-4`} />
            <h3 className="text-3xl font-display font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Post Job Form */}
      <AnimatePresence>
        {showPostJob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handlePostJob} className="glass p-8 rounded-3xl border-primary/20 space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Create a New Job Posting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Title</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="e.g. House Painting Project" 
                    value={newJob.title}
                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skill Required</label>
                  <select 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                    value={newJob.skillRequired}
                    onChange={e => setNewJob({...newJob, skillRequired: e.target.value})}
                  >
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="City, District" 
                    value={newJob.location}
                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="e.g. 5 days" 
                    value={newJob.duration}
                    onChange={e => setNewJob({...newJob, duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Wage (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="800" 
                    value={newJob.wage}
                    onChange={e => setNewJob({...newJob, wage: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Description</label>
                <textarea 
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none h-32 resize-none" 
                  placeholder="Describe the work details..."
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowPostJob(false)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-saffron px-8 py-3 rounded-xl font-bold text-white disabled:opacity-50">
                  {isSubmitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* My Posted Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">My Posted Jobs</h3>
          <div className="space-y-4">
            {myJobs.map(job => (
              <div key={job.id} className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{job.title}</h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="text-primary font-bold">{job.skillRequired}</span>
                      <span>•</span>
                      <span className={`font-bold capitalize ${job.status === 'active' ? 'text-green-500' : 'text-accent'}`}>{job.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{job.applicantsCount || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Applicants</p>
                  </div>
                  <button 
                    onClick={() => fetchApplicants(job.id!)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all text-gray-400"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hired Workers */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Hired Workers</h3>
          <div className="space-y-4">
            {hiredWorkers.length > 0 ? hiredWorkers.map(worker => (
              <div key={worker.uid} className="glass p-6 rounded-2xl border-green-500/20">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={worker.photo} 
                    alt={worker.fullName} 
                    className="h-12 w-12 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-white font-bold">{worker.fullName}</h4>
                    <p className="text-xs text-gray-500">{worker.trade} · Hired recently</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedWorker(worker);
                    setShowRatingModal(true);
                  }}
                  className="w-full py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                >
                  Mark Complete
                </button>
              </div>
            )) : (
              <div className="glass p-8 rounded-2xl text-center border-white/5">
                <p className="text-gray-500 text-sm">No workers hired yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicants Side Panel */}
      <AnimatePresence>
        {showApplicants && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplicants(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-card h-full shadow-2xl border-l border-border p-8 overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold text-white">Applicants (12)</h3>
                <button onClick={() => setShowApplicants(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {applicants.map(worker => (
                  <div key={worker.uid} className="glass p-6 rounded-2xl border-white/5 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={worker.photo} 
                          alt={worker.fullName} 
                          className="h-12 w-12 rounded-full object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-white font-bold">{worker.fullName}</h4>
                          <p className="text-xs text-gray-500">{worker.location.district}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${worker.dakshScore > 70 ? 'text-green-500' : 'text-accent'}`}>{worker.dakshScore}</div>
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Daksh Score</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {worker.skills.slice(0, 2).map(s => (
                        <span key={s} className="bg-white/5 text-gray-400 px-2 py-1 rounded text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate(`/worker/${worker.uid}`)}
                        className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        View Profile
                      </button>
                      <button onClick={() => handleHire(worker)} className="flex-1 btn-saffron py-2 rounded-lg text-xs font-bold text-white">Hire Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-sm w-full text-center border-primary/30"
            >
              <h3 className="text-2xl font-display font-bold text-white mb-4">Rate Worker</h3>
              <p className="text-gray-400 mb-8">How was your experience with {selectedWorker?.fullName}?</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <button 
                    key={i} 
                    onClick={() => setRating(i)}
                    className={`p-2 transition-all ${rating >= i ? 'text-accent scale-110' : 'text-gray-700'}`}
                  >
                    <StarIcon className={`h-8 w-8 ${rating >= i ? 'fill-accent' : ''}`} />
                  </button>
                ))}
              </div>

              <textarea 
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none h-24 resize-none mb-6 text-sm"
                placeholder="Write a short review..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />

              <div className="flex gap-4">
                <button onClick={() => setShowRatingModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500">Cancel</button>
                <button 
                  onClick={handleComplete}
                  className="flex-1 btn-saffron py-3 rounded-xl font-bold text-white"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI Payment Modal */}
      <AnimatePresence>
        {showUPIDialog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-bg/90 backdrop-blur-md">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-md w-full border-primary/30 text-center"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">UPI Payment</h3>
              <p className="text-gray-400 mb-6">Pay <span className="text-white font-bold">{activeWorkerName}</span> for the completed job.</p>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                  <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Amount to Pay</span>
                  <span className="text-2xl font-display font-bold text-accent">₹{activeAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">UPI ID</span>
                  <span className="text-white font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/5">{activeUPIId}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const upiUrl = `upi://pay?pa=${activeUPIId}&pn=${activeWorkerName}&am=${activeAmount}&cu=INR`;
                    window.open(upiUrl, '_blank');
                    toast.success('UPI App Requested');
                  }}
                  className="w-full btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" /> Pay with UPI App
                </button>
                <button 
                  onClick={processCompletion}
                  className="w-full bg-white/5 border border-white/10 py-4 rounded-xl font-bold text-white hover:bg-white/10 transition-all"
                >
                  Confirm & Complete
                </button>
                <button 
                  onClick={() => setShowUPIDialog(false)}
                  className="w-full py-2 text-gray-500 text-sm font-bold hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;
