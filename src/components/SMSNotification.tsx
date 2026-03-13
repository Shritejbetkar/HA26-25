import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SMSNotification: React.FC = () => {
  const { smsNotification, closeSMS } = useAuth();

  if (!smsNotification || !smsNotification.visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4"
      >
        <div className="bg-[#1c1c1e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 p-1 rounded-md">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Messages</span>
              <span className="text-[10px] text-gray-600">• now</span>
            </div>
            <button onClick={closeSMS} className="p-1 hover:bg-white/5 rounded-full transition-colors">
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <div className="p-4 flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-grow">
              <h4 className="text-xs font-bold text-white mb-1">Daksh-Bharat OTP</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {smsNotification.message}
              </p>
            </div>
          </div>
          <div className="h-1 bg-green-500/20 w-full">
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="h-full bg-green-500"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SMSNotification;
