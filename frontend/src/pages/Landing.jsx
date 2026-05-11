import { Link } from 'react-router-dom';
import { AlertTriangle, Map, BarChart3, Bell, Shield, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  { Icon: Map,           title: 'Interactive Map',       desc: 'Choropleth view of all 33 Telangana districts colour-coded by poverty cluster.' },
  { Icon: BarChart3,     title: 'ML-Powered Analysis',   desc: 'K-Means clustering + Random Forest classifier trained on NFHS-5 real data.' },
  { Icon: Bell,          title: 'NGO Alerts',            desc: 'Instant email notifications when a district crosses your alert threshold.' },
  { Icon: Shield,        title: 'Secure Authentication', desc: 'Supabase-powered NGO authentication with personalised dashboards.' },
  { Icon: Layers,        title: 'District Deep Dive',    desc: 'Bar charts for all 8 poverty indicators for any selected district.' },
  { Icon: AlertTriangle, title: 'Hotspot Detection',     desc: 'Real-time identification of High Poverty districts needing intervention.' },
];

const DISTRICTS = ['Adilabad','Bhadradri Kothagudem','Hyderabad','Jagitial','Jangoan',
  'Jayashankar','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* Hero */}
      <section className="hero-gradient relative py-32 px-4 flex items-center justify-center min-h-[85vh]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 glass-card border-orange-500/20">
            <span className="w-2 h-2 rounded-full bg-orange-500 pulse-dot" />
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Live Poverty Monitoring · Telangana 2026
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-white">
            Expose <br />
            <span className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 bg-clip-text text-transparent">
              Poverty Hotspots
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto text-slate-400 leading-relaxed font-medium">
            Next-gen ML platform for NGOs to track, analyze, and intervene in 
            poverty-stricken regions across Telangana's 33 districts.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-6 justify-center">
            <Link to="/signup" className="btn-primary group flex items-center gap-3 text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-orange-500/20">
              Launch Dashboard 
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <ArrowRight size={20} />
              </motion.span>
            </Link>
            <Link to="/map" className="btn-outline glass-card border-white/10 flex items-center gap-3 text-lg px-8 py-4 rounded-2xl">
              <Map size={20} /> Regional Map
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Ticker of districts */}
      <div className="py-4 glass-card border-x-0 rounded-none border-white/5 relative z-20">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...DISTRICTS,...DISTRICTS,...DISTRICTS].map((d,i) => (
            <span key={i} className="text-sm font-bold tracking-widest uppercase flex items-center gap-2 text-orange-500/80">
              <span className="w-1 h-1 rounded-full bg-orange-500" />
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Intelligence at Scale
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="text-slate-400 text-lg max-w-2xl mx-auto"
            >
              Harnessing NFHS-5 real-world data and advanced clustering algorithms to 
              provide actionable insights for humanitarian aid.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ Icon, title, desc }, idx) => (
              <motion.div 
                key={title} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card p-8 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />
                
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <Icon size={28} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto glass-card p-12 md:p-20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-white relative z-10">Start Saving Lives with Data</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto relative z-10">
            Join the network of NGOs using automated alerts and real-time clustering to 
            optimize their resource allocation.
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10"
          >
            <Link to="/signup" className="btn-primary px-12 py-5 text-xl font-bold rounded-2xl inline-block shadow-2xl shadow-orange-500/30">
              Register Your NGO Now
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm border-t border-white/5 bg-navy/50 backdrop-blur-sm">
        <p className="text-slate-500 mb-2">© 2026 PovertyHotspotTG · Telangana District Monitoring</p>
        <p className="text-slate-600">Empowering Humanitarian Aid Through Machine Learning</p>
      </footer>
    </div>
  );
}
