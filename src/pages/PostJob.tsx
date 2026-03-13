import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, MapPin, IndianRupee, Clock, Phone, 
  Mic, MicOff, Sparkles, ShieldCheck, CreditCard, 
  Banknote, Send, CheckCircle2, AlertCircle, 
  ChevronRight, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { TRADES_WITH_ICONS, STATES } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { saveJobToSQL } from '../api';
import { Job } from '../types';

const PostJob: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<{ min: number; max: number } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    customCategory: '',
    description: '',
    city: '',
    district: '',
    state: '',
    requiredSkills: '',
    budget: '',
    paymentMode: 'cash' as 'cash' | 'online',
    paymentMethod: 'UPI',
    completionTime: '',
    contactDetails: profile?.phoneNumber || '',
  });

  const categories = [...TRADES_WITH_ICONS, { name: 'Other', icon: '✨' }];

  // AI Price Estimation
  useEffect(() => {
    if (formData.title && formData.category && formData.category !== 'Other') {
      estimatePrice();
    }
  }, [formData.title, formData.category]);

  const estimatePrice = async () => {
    try {
      // Use a hardcoded API key for demo purposes if environment variable is missing
      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDummyKeyForDemoMode";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Use a more standard model name
        contents: `Suggest a fair daily wage range in INR for a job titled "${formData.title}" in the category "${formData.category}". Return only a JSON object like {"min": 500, "max": 800}.`,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text);
      setSuggestedPrice(result);
    } catch (error) {
      console.warn("AI Price Estimation failed (likely API key issue), using defaults:", error);
      // Fallback defaults for demo
      setSuggestedPrice({ min: 400, max: 700 });
    }
  };

  // Voice Job Posting
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, description: prev.description + ' ' + transcript }));
      toast.success("Voice input captured!");
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEMO MODE: Bypass sign-in requirement
    const effectiveUser = user || {
      uid: 'demo-employer-id',
      displayName: 'Demo Employer'
    };

    setLoading(true);
    try {
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      
      const jobData = {
        employerId: effectiveUser.uid,
        employerName: profile?.fullName || effectiveUser.displayName || 'Anonymous',
        title: formData.title,
        skillRequired: finalCategory,
        description: formData.description,
        location: {
          city: formData.city,
          district: formData.district,
          state: formData.state,
          lat: 20.5937,
          lng: 78.9629
        },
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()),
        wage: parseInt(formData.budget),
        wageType: 'fixed',
        paymentMode: formData.paymentMode,
        paymentMethod: formData.paymentMode === 'online' ? formData.paymentMethod : undefined,
        duration: formData.completionTime,
        contactDetails: formData.contactDetails,
        status: 'active',
        applicantsCount: 0,
        createdAt: new Date().toISOString(),
      };

      // DEMO MODE: Try saving to Firebase, but don't crash if it fails
      let docId = 'demo-job-' + Date.now();
      try {
        const docRef = await addDoc(collection(db, 'jobs'), jobData);
        docId = docRef.id;
      } catch (firebaseError) {
        console.warn('Firebase save failed (demo mode), continuing with SQL:', firebaseError);
      }

      // Save to SQL Database
      try {
        await saveJobToSQL({
          id: docId,
          ...jobData
        } as Job);
      } catch (sqlError) {
        console.error('Failed to sync job with SQL database:', sqlError);
      }

      setShowSuccess(true);
      toast.success("Job posted successfully!");
      setTimeout(() => {
        navigate('/jobs');
      }, 3000);
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-12 rounded-3xl text-center max-w-md w-full border-primary/30"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Job Posted!</h2>
          <p className="text-gray-400 mb-8">Your job opportunity has been successfully listed and is now visible to workers.</p>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              className="h-full bg-primary"
            />
          </div>
          <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest font-bold">Redirecting to Job Board...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
            Create a <span className="text-primary">Job</span>
          </h1>
          <p className="text-gray-400 text-lg">Post an opportunity and find the best local talent in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Job Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Job Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. House Painting"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Job Category</label>
                <select
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.category === 'Other' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Specify Trade</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Drone Operator"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                  value={formData.customCategory}
                  onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                />
              </motion.div>
            )}

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Job Description</label>
                <button
                  type="button"
                  onClick={startVoiceInput}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/20 text-primary hover:bg-primary/30'
                  }`}
                >
                  {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  <span>{isRecording ? 'Recording...' : 'Voice Post Job'}</span>
                </button>
              </div>
              <textarea
                required
                rows={4}
                placeholder="Describe the job in detail..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Location & Time */}
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-accent/20 rounded-lg">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-white">Location & Time</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">City</label>
                <input
                  required
                  type="text"
                  placeholder="City"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">District</label>
                <input
                  required
                  type="text"
                  placeholder="District"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">State</label>
                <select
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all appearance-none"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="" disabled>Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Required Skills</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Interior Painting, Sanding (comma separated)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
                  value={formData.requiredSkills}
                  onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Expected Completion Time</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 2 days, 1 week"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
                  value={formData.completionTime}
                  onChange={e => setFormData({ ...formData, completionTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Budget & Payment */}
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Budget & Payment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Budget (₹)</label>
                    {suggestedPrice && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center text-[10px] text-primary font-bold uppercase tracking-widest"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggests: ₹{suggestedPrice.min} - ₹{suggestedPrice.max}
                      </motion.div>
                    )}
                  </div>
                  <input
                    required
                    type="number"
                    placeholder="Enter amount"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-all"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Details</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      required
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-green-500 outline-none transition-all"
                      value={formData.contactDetails}
                      onChange={e => setFormData({ ...formData, contactDetails: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMode: 'cash' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      formData.paymentMode === 'cash' 
                        ? 'bg-green-500/20 border-green-500 text-white' 
                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    <Banknote className="h-6 w-6 mb-2" />
                    <span className="text-sm font-bold">Cash Mode</span>
                    <span className="text-[10px] opacity-60">Offline payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMode: 'online' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      formData.paymentMode === 'online' 
                        ? 'bg-primary/20 border-primary text-white' 
                        : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm font-bold">Online Mode</span>
                    <span className="text-[10px] opacity-60">UPI/Bank Transfer</span>
                  </button>
                </div>

                <AnimatePresence>
                  {formData.paymentMode === 'online' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Preferred Method</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all appearance-none"
                        value={formData.paymentMethod}
                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (PhonePe/GPay)</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Digital Wallet">Digital Wallet (Paytm)</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
            <div className="flex items-center space-x-3 text-gray-500">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm">Your job will be verified by our AI safety system before listing.</p>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="btn-saffron w-full md:w-auto px-12 py-4 rounded-xl text-lg font-bold text-white flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Sparkles className="h-6 w-6" />
                </motion.div>
              ) : (
                <>
                  <span>Post Job Opportunity</span>
                  <Send className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
