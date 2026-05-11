import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, color = '#f97316', Icon }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      viewport={{ once: true }}
      className="card flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>{title}</p>
          <p className="text-3xl font-bold" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
          {subtitle && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${color}22` }}>
            <Icon size={22} style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
