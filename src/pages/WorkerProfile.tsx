import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Calendar, IndianRupee, Star, ShieldCheck, Share2, 
  Phone, Briefcase, CheckCircle, ArrowLeft, Loader2,
  Mail, Award, History, CheckCircle2, MessageSquare,
  UserCheck, Sparkles, Send, MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MOCK_WORKERS } from '../constants';
import { UserProfile, Job, Review, Application } from '../types';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserById, fetchApplicationsByWorker, fetchReviewsByWorker, saveReviewToSQL, saveApplicationToSQL, fetchJobs } from '../api';

const DakshScoreRing: React.FC<{ score: number, size?: 'sm' | 'lg' }> = ({ score, size = 'lg' }) => {
  const radius = size === 'lg' ? 60 : 25;
  const stroke = size === 'lg' ? 8 : 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 40) return '#EF4444';
    if (s <= 70) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={getColor(score)}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="daksh-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${size === 'lg' ? 'text-3xl' : 'text-sm'} font-display font-bold text-white`}>
          {score}
        </span>
      </div>
    </div>
  );
};

const WorkerProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [worker, setWorker] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobsApplied, setJobsApplied] = useState<Job[]>([]);
  const [jobsCompleted, setJobsCompleted] = useState<Job[]>([]);
  const [jobsWorking, setJobsWorking] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!id) return;
      
      let data: UserProfile | null = null;
      
      try {
        // Try Firebase first
        try {
          const docRef = doc(db, 'users', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            data = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          }
        } catch (firebaseError) {
          console.warn('Firebase fetch failed (demo mode or permission issue), trying SQL:', firebaseError);
        }

        // Try fetching from SQL if Firebase failed or didn't exist
        if (!data) {
          try {
            data = await fetchUserById(id);
            console.log('Successfully fetched user from SQL:', data);
          } catch (sqlError) {
            console.error('Error fetching user from SQL:', sqlError);
          }
        }
        
        if (data) {
          setWorker(data);
          
          // Fetch jobs related to this worker (wrapped in try-catch for demo mode)
          try {
            const jobsQuery = query(collection(db, 'jobs'), where('applicants', 'array-contains', id));
            const jobsSnap = await getDocs(jobsQuery);
            const firebaseJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
            
            // Fallback to SQL for applications/jobs if Firebase fails or is empty
            const sqlApps = await fetchApplicationsByWorker(id);
            // In a real app, we'd map these to full job objects. 
            // For now, let's just merge what we have.
            
            setJobsApplied(firebaseJobs.filter(j => j.status === 'active'));
            setJobsWorking(firebaseJobs.filter(j => j.status === 'working' && j.confirmedWorkerId === id));
            setJobsCompleted(firebaseJobs.filter(j => j.status === 'completed' && j.confirmedWorkerId === id));
          } catch (jobsError) {
            console.warn('Firebase jobs fetch failed, trying SQL:', jobsError);
            const sqlApps = await fetchApplicationsByWorker(id);
            // Simplified mapping for demo
            setJobsApplied(sqlApps.map(a => ({ id: a.jobId, title: a.jobTitle, status: 'active' } as any)));
          }

          // Fetch reviews (wrapped in try-catch for demo mode)
          try {
            const reviewsQuery = query(collection(db, 'reviews'), where('workerId', '==', id));
            const reviewsSnap = await getDocs(reviewsQuery);
            const firebaseReviews = reviewsSnap.docs.map(d => d.data() as Review);
            
            const sqlReviews = await fetchReviewsByWorker(id);
            const allReviews = [...firebaseReviews, ...sqlReviews.filter(sr => !firebaseReviews.some(fr => fr.id === sr.id))];
            
            setReviews(allReviews);
          } catch (reviewsError) {
            console.warn('Firebase reviews fetch failed, trying SQL:', reviewsError);
            const sqlReviews = await fetchReviewsByWorker(id);
            setReviews(sqlReviews);
          }

        } else {
          const found = MOCK_WORKERS.find(w => w.uid === id);
          if (found) {
            setWorker(found as any);
          } else {
            toast.error('Worker not found');
            navigate('/browse');
          }
        }
      } catch (error) {
        console.error('Error in fetchWorkerData:', error);
        toast.error('Failed to load worker profile');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [id, navigate]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !worker) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        workerId: worker.uid,
        employerId: user.uid || 'demo-employer-id',
        employerName: profile?.fullName || user.displayName || 'Demo Employer',
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      // 1. Try Firestore only if real user
      if (user && !user.uid.includes('demo')) {
        try {
          await addDoc(collection(db, 'reviews'), {
            ...reviewData,
            createdAt: serverTimestamp()
          });
        } catch (e) {}
      }
      
      // 2. Save to SQL Database (Demo Mode)
      try {
        await saveReviewToSQL({
          id: `rev-${Date.now()}`,
          ...reviewData
        } as Review);
      } catch (sqlError) {
        console.warn('Failed to save review to SQL:', sqlError);
      }
      
      // Update worker's average rating (simplified)
      if (user && !user.uid.includes('demo')) {
        try {
          const newRating = ((worker.rating || 5) + rating) / 2;
          await updateDoc(doc(db, 'users', worker.uid), {
            rating: newRating
          });
        } catch (e) {}
      }

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setComment('');
      // Refresh reviews
      setReviews([...reviews, { ...reviewData, createdAt: new Date() } as any]);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHireRequest = async () => {
    if (!user || !worker) {
      toast.error('Please sign in to send a hire request');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (profile?.role !== 'employer' && user.uid !== 'demo-employer-id') {
      toast.error('Only employers can send hire requests');
      return;
    }

    try {
      // For a "Hire Request" from profile, we need to pick a job.
      // For demo purposes, let's just use the first active job of this employer.
      const jobs = await fetchJobs();
      const myActiveJobs = jobs.filter(j => (j.employerId === user.uid || j.employerId === 'demo-employer-id') && j.status === 'active');
      
      if (myActiveJobs.length === 0) {
        toast.error('You need an active job post to send a hire request');
        return;
      }

      const job = myActiveJobs[0];
      const appData: Partial<Application> = {
        jobId: job.id,
        workerId: worker.uid,
        employerId: user.uid || 'demo-employer-id',
        workerName: worker.fullName,
        jobTitle: job.title,
        status: 'pending'
      };

      // 1. Try Firestore only if we have a real user and not demo
      if (user && !user.uid.includes('demo')) {
        try {
          await addDoc(collection(db, 'applications'), {
            ...appData,
            createdAt: serverTimestamp()
          });
        } catch (e) {}
      }

      // 2. Save to SQL
      await saveApplicationToSQL(appData);

      toast.success(`Hire request sent to ${worker.fullName}!`);
    } catch (error) {
      console.error('Error sending hire request:', error);
      toast.error('Failed to send hire request');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading Profile...</p>
    </div>
  );

  if (!worker) return <div className="p-20 text-center text-gray-500">Worker not found</div>;

  const handleShare = () => {
    const text = `Check out ${worker.fullName}'s verified skill profile on Daksh-Bharat: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-3xl border-primary/20 relative overflow-hidden">
            {/* AI Skill Verification Badge */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Verified Skills</span>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative">
                <div className="h-32 w-32 bg-secondary rounded-2xl flex items-center justify-center text-4xl font-bold text-white border-2 border-primary/30 overflow-hidden">
                  {worker.photo ? (
                    <img 
                      src={worker.photo} 
                      alt={worker.fullName} 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    worker.fullName.charAt(0)
                  )}
                </div>
                {worker.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-full border-4 border-card">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-grow text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-4xl font-display font-bold text-white">{worker.fullName}</h1>
                  <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full uppercase tracking-widest">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Open for Work
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 mb-6">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-primary" />
                    {worker.trade}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    {worker.location?.city}, {worker.location?.district}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {worker.experience} Years Exp.
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="glass px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Aadhaar Verified
                  </span>
                  <span className="glass px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center">
                    <Award className="h-4 w-4 mr-2 text-primary" /> Skill Certified
                  </span>
                  <span className="glass px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center">
                    <Star className="h-4 w-4 mr-2 text-accent" /> {reviews.length} Reviews
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <DakshScoreRing score={worker.dakshScore || 0} />
                <span className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Daksh Score</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-3xl border-white/5 text-center">
              <History className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-white">{jobsApplied.length}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Jobs Applied</p>
            </div>
            <div className="glass p-6 rounded-3xl border-white/5 text-center">
              <Briefcase className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-white">{jobsWorking.length}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Currently Working</p>
            </div>
            <div className="glass p-6 rounded-3xl border-white/5 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-white">{jobsCompleted.length}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Completed Jobs</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-display font-bold text-white mb-6 uppercase tracking-widest">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-3">
              {worker.skills?.map(skill => (
                <span key={skill} className="bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/30">
                  {skill}
                </span>
              ))}
              <span className="bg-accent/20 text-accent px-4 py-2 rounded-xl text-sm font-bold border border-accent/30">
                {worker.trade} · {worker.experience} yrs
              </span>
            </div>
          </div>

          {/* Work History / Reviews */}
          <div className="glass p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Work History & Reviews</h3>
              {profile?.role === 'employer' && !showReviewForm && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/80 transition-all"
                >
                  Rate Worker
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 p-6 bg-white/5 rounded-2xl border border-primary/20 overflow-hidden"
                >
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-sm font-bold text-gray-400">Rating:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(i)}
                            className={`p-1 transition-all ${i <= rating ? 'text-accent' : 'text-gray-600'}`}
                          >
                            <Star className={`h-6 w-6 ${i <= rating ? 'fill-accent' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your review here..."
                      className="w-full bg-card border border-border rounded-xl p-4 text-white focus:border-primary outline-none min-h-[100px]"
                      required
                    />
                    <div className="flex justify-end space-x-3">
                      <button 
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={submittingReview}
                        className="btn-saffron px-6 py-2 rounded-xl font-bold text-white flex items-center"
                      >
                        {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Review
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {reviews.length > 0 ? reviews.map((review, i) => (
                <div key={i} className="relative pl-12">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-primary rounded-full border-4 border-bg" />
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">{review.employerName}</h4>
                    <div className="flex items-center text-accent">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'fill-accent' : 'text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {review.createdAt instanceof Date ? review.createdAt.toLocaleDateString() : 'Recently'}
                  </p>
                  <p className="text-sm text-gray-500 italic">"{review.comment}"</p>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-600">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Contact Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-6">
            <div className="glass p-8 rounded-3xl border-accent/20">
              <div className="text-center mb-8">
                <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-2">Daily Wage Expectation</p>
                <div className="flex items-center justify-center text-4xl font-display font-bold text-accent">
                  <IndianRupee className="h-8 w-8" /> {worker.wage}
                  <span className="text-sm text-gray-500 ml-2 font-sans">/ day</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Available from</span>
                  <span className="text-white font-bold">Immediate</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preferred Location</span>
                  <span className="text-white font-bold">{worker.location?.district}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Contact Number</span>
                  <span className="text-white font-bold">{worker.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white font-bold truncate max-w-[150px]">{worker.email || 'Not provided'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleHireRequest}
                  className="w-full btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center"
                >
                  <UserCheck className="h-5 w-5 mr-2" /> Send Hire Request
                </button>
                {worker.phoneNumber && (
                  <button 
                    onClick={() => window.open(`https://wa.me/91${worker.phoneNumber}`, '_blank')}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] transition-colors py-4 rounded-xl font-bold text-white flex items-center justify-center"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" /> WhatsApp
                  </button>
                )}
                <button 
                  onClick={handleShare}
                  className="w-full bg-white/5 hover:bg-white/10 transition-colors py-4 rounded-xl font-bold text-white flex items-center justify-center border border-white/10"
                >
                  <Share2 className="h-5 w-5 mr-2" /> Share Profile
                </button>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border-primary/10">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Daksh Verification
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                This worker has completed physical skill verification and Aadhaar identity check. Their Daksh Score is based on employer ratings, experience, and certification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
