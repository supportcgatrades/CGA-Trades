import React from 'react';
import { Shield, Zap, Globe, Target, Cpu, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const FeatureCard = React.memo(({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ delay }}
      style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      className="p-8 md:p-10 bg-[#0c0f14] border border-white/5 rounded-[2.5rem] hover:border-primary/20 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary mb-8 border border-white/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
        <Icon size={30} />
      </div>
      
      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-4 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="text-[11px] md:text-sm text-aura-muted font-medium leading-relaxed uppercase tracking-[0.05em] opacity-60 group-hover:opacity-80 transition-opacity">
        {description}
      </p>
    </motion.div>
  );
});

export default function WhyChooseSection() {
  const features = [
    {
      icon: Shield,
      title: "Sovereign Security",
      description: "Military-grade encryption with multi-signature cold storage vaults for total asset protection."
    },
    {
      icon: Zap,
      title: "Neural Trading",
      description: "Proprietary AI node clusters that detect market inefficiency at sub-millisecond speeds."
    },
    {
      icon: Target,
      title: "Precision ROI",
      description: "Consistent yield generation through optimized asset orchestration and automated risk management."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Localized node infrastructure across 120 countries ensuring 99.9% uptime and low latency."
    },
    {
      icon: Cpu,
      title: "Next-Gen Engine",
      description: "Quantum-ready trading architecture built for the 2030 financial landscape."
    },
    {
      icon: Activity,
      title: "Live Monitoring",
      description: "Real-time verification and neural link dashboards for total transparency."
    }
  ];

  return (
    <section className="w-full bg-[#050608] py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-start gap-4 mb-16 px-4">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
              Why Choose <span className="text-primary italic font-serif">CGA</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={idx} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
