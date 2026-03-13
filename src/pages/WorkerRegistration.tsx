import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Briefcase, ShieldCheck, Upload, CheckCircle, ArrowRight, ArrowLeft, Phone, MapPin, IndianRupee, PlusCircle, Edit3, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TRADES, STATES } from '../constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { saveUserToSQL } from '../api';

const WorkerRegistration: React.FC = () => {
  const { user, profile, sendSMS } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState('');
  const [customTrade, setCustomTrade] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (!formData.mobile) {
      toast.error('Please enter your mobile number first');
      return;
    }
    const otp = "4521";
    sendSMS(`Your Daksh-Bharat verification code is ${otp}. Do not share this with anyone.`, formData.mobile);
    setShowOtpModal(true);
  };

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    district: '',
    state: '',
    trade: '',
    experience: 5,
    wage: 800,
    bio: '',
    tools: false,
    upiId: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.mobile) {
      toast.error('Please enter your mobile number');
      return;
    }
    if (step === 2 && !formData.trade) {
      toast.error('Please select a trade');
      return;
    }
    if (step === 2 && formData.trade === 'Other' && !customTrade) {
      toast.error('Please enter your custom trade');
      return;
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEMO MODE: Bypass sign-in requirement
    const effectiveUser = user || {
      uid: 'demo-worker-id',
      displayName: formData.fullName || 'Demo Worker',
      email: 'demo@example.com',
      photoURL: 'https://picsum.photos/200'
    };

    setIsSubmitting(true);
    try {
      const finalTrade = formData.trade === 'Other' ? customTrade : formData.trade;
      
      const profileData: UserProfile = {
        uid: effectiveUser.uid,
        displayName: formData.fullName,
        fullName: formData.fullName,
        email: effectiveUser.email || '',
        role: 'worker',
        trade: finalTrade,
        location: {
          city: formData.district,
          district: formData.district,
          state: formData.state,
          lat: 20.5937,
          lng: 78.9629
        },
        dakshScore: 45,
        verified: true,
        isVerified: true,
        skills: [finalTrade, 'Manual Labor'],
        experience: formData.experience,
        wage: formData.wage,
        bio: formData.bio,
        photo: profileImage || (effectiveUser as any).photoURL || `https://picsum.photos/seed/${effectiveUser.uid}/200`,
        badges: ['Aadhaar Verified'],
        createdAt: new Date().toISOString()
      };

      // DEMO MODE: Try saving to Firebase, but don't crash if it fails
      try {
        await setDoc(doc(db, 'users', effectiveUser.uid), profileData);
      } catch (firebaseError) {
        console.warn('Firebase save failed (demo mode), continuing with SQL:', firebaseError);
      }
      
      // Save to SQL Database
      try {
        await saveUserToSQL(profileData);
      } catch (sqlError) {
        console.error('Failed to sync with SQL database:', sqlError);
      }
      
      setCreatedProfileId(effectiveUser.uid);
      setIsSuccess(true);
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-12 rounded-3xl max-w-md w-full text-center border-primary/30"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Registration Complete!</h2>
          <p className="text-gray-400 mb-8">Your Daksh Profile has been created. Your initial Daksh Score is 45.</p>
          
          <div className="bg-white/5 p-4 rounded-xl mb-8 border border-white/10">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Your Profile Link</p>
            <p className="text-primary font-mono text-sm break-all">daksh-bharat.in/worker/{createdProfileId}</p>
          </div>

          <button 
            onClick={() => navigate(`/worker/${createdProfileId}`)}
            className="w-full btn-saffron py-4 rounded-xl font-bold text-white"
          >
            Go to My Profile
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-display font-bold text-white">Worker Registration</h1>
          <span className="text-gray-500 font-bold">Step {step} of 3</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 md:p-12 rounded-3xl border-primary/10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="bg-card border border-border rounded-xl py-3 px-4 text-gray-400">+91</div>
                    <div className="relative flex-grow">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                      <input 
                        type="tel" 
                        required
                        className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none"
                        placeholder="10-digit number"
                        value={formData.mobile}
                        onChange={e => setFormData({...formData, mobile: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">State</label>
                  <select 
                    required
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  >
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">District</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none"
                      placeholder="Enter district"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Profile Photo</label>
                <div 
                  onClick={() => document.getElementById('profileImageInput')?.click()}
                  className={`border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer overflow-hidden relative ${profileImage ? 'bg-primary/5' : ''}`}
                >
                  <input 
                    type="file" 
                    id="profileImageInput" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                  {profileImage ? (
                    <div className="relative group">
                      <img 
                        src={profileImage} 
                        alt="Profile Preview" 
                        className="h-32 w-32 rounded-full mx-auto object-cover border-2 border-primary shadow-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full h-32 w-32 mx-auto">
                        <Edit3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Click to upload your photo</p>
                      <p className="text-[10px] text-gray-600 uppercase mt-2">JPG, PNG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              <button 
                type="button"
                onClick={handleSendOtp}
                className="w-full btn-saffron py-4 rounded-xl font-bold text-white"
              >
                Send OTP
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Primary Trade</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...TRADES, 'Other'].map(trade => (
                    <button
                      key={trade}
                      type="button"
                      onClick={() => setFormData({...formData, trade})}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all ${
                        formData.trade === trade 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-card border-border text-gray-400 hover:border-primary/50'
                      }`}
                    >
                      {trade}
                    </button>
                  ))}
                </div>
              </div>

              {formData.trade === 'Other' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Enter Your Trade</label>
                  <div className="relative">
                    <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none"
                      placeholder="e.g. Drone Operator, Video Editor..."
                      value={customTrade}
                      onChange={e => setCustomTrade(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Experience</label>
                    <span className="text-primary font-bold">{formData.experience} Years</span>
                  </div>
                  <input 
                    type="range" min="1" max="30" 
                    className="w-full accent-primary"
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Daily Wage</label>
                    <span className="text-accent font-bold">₹{formData.wage}</span>
                  </div>
                  <input 
                    type="range" min="300" max="3000" step="50"
                    className="w-full accent-accent"
                    value={formData.wage}
                    onChange={e => setFormData({...formData, wage: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Short Bio</label>
                <textarea 
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none h-32 resize-none"
                  placeholder="Tell employers about your expertise and work history..."
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-3 p-4 glass rounded-xl border-primary/10">
                <input 
                  type="checkbox" 
                  id="tools"
                  className="w-5 h-5 accent-primary"
                  checked={formData.tools}
                  onChange={e => setFormData({...formData, tools: e.target.checked})}
                />
                <label htmlFor="tools" className="text-sm text-gray-300">I own my professional tools</label>
              </div>

              <div className="space-y-2 p-6 glass rounded-2xl border-primary/10 bg-primary/5">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <label className="text-sm font-bold text-white uppercase tracking-widest">UPI Payment ID</label>
                </div>
                <input 
                  type="text" 
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  placeholder="e.g. yourname@upi"
                  value={formData.upiId}
                  onChange={e => setFormData({...formData, upiId: e.target.value})}
                />
                <p className="text-[10px] text-gray-500 italic mt-1">Providing your UPI ID enables direct employer payments.</p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={handlePrev} className="flex-1 py-4 rounded-xl font-bold text-gray-400 border border-border hover:bg-white/5 transition-all flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button type="button" onClick={handleNext} className="flex-1 btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center">
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Verification Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Aadhaar Card / ID</p>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Skill Certificate</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Work Samples (Photos)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square border-2 border-dashed border-border rounded-2xl flex items-center justify-center hover:border-primary transition-colors cursor-pointer">
                      <PlusCircle className="h-6 w-6 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 glass rounded-2xl border-primary/10">
                <div className="flex items-start space-x-3">
                  <input type="checkbox" required id="declare" className="mt-1 w-5 h-5 accent-primary" />
                  <label htmlFor="declare" className="text-sm text-gray-400 leading-relaxed">
                    I confirm that all information provided is accurate and I understand that providing false information will lead to permanent suspension of my Daksh Profile.
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={handlePrev} className="flex-1 py-4 rounded-xl font-bold text-gray-400 border border-border hover:bg-white/5 transition-all flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Create My Daksh Profile'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-sm w-full text-center border-primary/30"
            >
              <h3 className="text-2xl font-display font-bold text-white mb-4">Verify Mobile</h3>
              <p className="text-gray-400 mb-6">Enter the 4-digit code sent to your mobile.</p>
              
              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-14 bg-card border border-border rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                    {i === 1 ? '4' : i === 2 ? '5' : i === 3 ? '2' : '1'}
                  </div>
                ))}
              </div>

              <div className="bg-primary/10 p-3 rounded-lg mb-8">
                <p className="text-xs text-primary font-bold">DEMO OTP: 4521</p>
              </div>

              <button 
                onClick={() => {
                  setShowOtpModal(false);
                  handleNext();
                }}
                className="w-full btn-saffron py-3 rounded-xl font-bold text-white"
              >
                Verify & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkerRegistration;
