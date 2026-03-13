import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Sparkles, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SecureLogin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return toast.error('Please enter email or phone');

    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('OTP sent successfully!');
        setStep(2);
        setTimer(60); // 1 minute resend timer
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) return toast.error('Please enter all 6 digits');

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp: fullOtp }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('secure_token', data.token);
        toast.success('Login Successful!');
        navigate('/');
      } else {
        toast.error(data.error || 'Invalid OTP');
        if (data.remainingAttempts === 0) {
          setStep(1);
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (error) {
      toast.error('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 md:p-12 rounded-3xl border-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="h-24 w-24 text-primary" />
        </div>

        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 1 ? <Smartphone className="h-8 w-8 text-primary" /> : <ShieldCheck className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {step === 1 ? 'Secure Login' : 'Verify Identity'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 1 
              ? 'Enter your email or phone to receive a secure 6-digit code.' 
              : `Enter the code we sent to ${identifier}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRequestOtp} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email or Mobile</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {identifier.includes('@') ? <Mail className="h-5 w-5 text-gray-600" /> : <Phone className="h-5 w-5 text-gray-600" />}
                  </div>
                  <input 
                    type="text"
                    required
                    placeholder="example@mail.com or 9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-saffron py-4 rounded-2xl font-bold text-white flex items-center justify-center space-x-2 shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <span>Send Secure Code</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={(e) => handleVerifyOtp(e)} 
              className="space-y-8"
            >
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpInputs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:border-primary outline-none transition-all"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full btn-saffron py-4 rounded-2xl font-bold text-white flex items-center justify-center space-x-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Verify & Continue</span>}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-gray-500 hover:text-white transition-colors flex items-center mx-auto"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Use different email/phone
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-gray-600">
                  Didn't receive the code? {timer > 0 ? (
                    <span className="text-primary font-bold">Resend in {timer}s</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-primary font-bold hover:underline"
                    >
                      Resend Now
                    </button>
                  )}
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] text-gray-600 uppercase font-bold tracking-widest">
          <ShieldCheck className="h-3 w-3" />
          <span>End-to-End Encrypted Auth</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SecureLogin;
