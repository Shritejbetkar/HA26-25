import React from 'react';
import { motion } from 'motion/react';
import { Hammer, CheckCircle, ShieldCheck, TrendingUp, Users, Briefcase, Star, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TRADES } from '../constants';
import { useTranslation } from 'react-i18next';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const stats = [
    { label: 'Verified Workers', value: '2,400+', icon: Users },
    { label: 'Jobs Filled', value: '890+', icon: Briefcase },
    { label: 'Average Rating', value: '4.8★', icon: Star },
    { label: 'Districts Covered', value: '18', icon: MapPin },
  ];

  const workerSteps = [
    { title: 'Register', desc: 'Sign up with Aadhaar and Google to build your profile.', icon: '01' },
    { title: 'Get Verified', desc: 'Our team verifies your skills and identity.', icon: '02' },
    { title: 'Get Hired', desc: 'Employers find you and hire you for local jobs.', icon: '03' },
  ];

  const employerSteps = [
    { title: 'Post Job', desc: 'List your requirements and vacancy details.', icon: '01' },
    { title: 'Browse Talent', desc: 'View verified profiles and Daksh Scores.', icon: '02' },
    { title: 'Pay Securely', desc: 'Hire and pay workers with complete transparency.', icon: '03' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-primary/10 opacity-50" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, delay: 2 }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
                {t('hero.title')} <span className="text-primary">{t('hero.subtitle')}</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 max-w-lg">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/register/worker" className="btn-saffron px-8 py-4 rounded-xl text-lg font-bold text-white flex items-center justify-center">
                  {t('hero.cta_worker')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/jobs" className="px-8 py-4 rounded-xl text-lg font-bold text-white border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center">
                  {t('hero.cta_employer')}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 glass p-8 rounded-3xl border-primary/20">
                <img 
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800" 
                  alt="Worker" 
                  className="rounded-2xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-6 -right-6 glass p-6 rounded-2xl border-accent/30 animate-bounce">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Verified Status</p>
                      <p className="text-white font-bold">Skill Certified ✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="glass p-6 rounded-2xl text-center group hover:border-primary/50 transition-all"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-display font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400">Simple steps to connect talent with opportunity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Workers */}
            <div>
              <h3 className="text-2xl font-display font-bold text-primary mb-10 flex items-center">
                <Users className="mr-3 h-6 w-6" /> For Workers
              </h3>
              <div className="space-y-12">
                {workerSteps.map((step, idx) => (
                  <div key={step.title} className="flex items-start space-x-6">
                    <div className="text-4xl font-display font-bold text-white/10 group-hover:text-primary/20 transition-colors">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Employers */}
            <div>
              <h3 className="text-2xl font-display font-bold text-accent mb-10 flex items-center">
                <Briefcase className="mr-3 h-6 w-6" /> For Employers
              </h3>
              <div className="space-y-12">
                {employerSteps.map((step, idx) => (
                  <div key={step.title} className="flex items-start space-x-6">
                    <div className="text-4xl font-display font-bold text-white/10">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trades Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-4">Popular Trades</h2>
            <p className="text-gray-400">Find skilled professionals across various categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRADES.map((trade) => (
              <Link
                key={trade}
                to={`/browse?trade=${trade}`}
                className="glass p-8 rounded-2xl text-center group hover:border-primary transition-all hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors">
                  <Hammer className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{trade}</h4>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  {Math.floor(Math.random() * 100) + 20} Workers
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
            Ready to build a better future?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of workers and employers already using Daksh-Bharat to transform rural labor.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/register/worker" className="btn-saffron px-10 py-4 rounded-xl text-lg font-bold text-white">
              Join as Worker
            </Link>
            <button className="px-10 py-4 rounded-xl text-lg font-bold text-white border border-white/20 hover:bg-white/5 transition-all">
              Post a Job Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
