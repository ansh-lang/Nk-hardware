import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, Award, Clock, Truck, Headphones, Zap, Star } from 'lucide-react';

const WhyUsPage = ({ onBack }: { onBack: () => void }) => {
  const features = [
    {
      icon: <ShieldCheck className="text-brand-orange" size={32} />,
      title: "Quality Assurance",
      description: "We only deal in certified, high-grade plumbing and hardware products from top brands like Astral, Birla, and Supreme."
    },
    {
      icon: <Award className="text-brand-orange" size={32} />,
      title: "Authorized Dealer",
      description: "As an authorized dealer, we guarantee 100% authentic products directly from the manufacturers."
    },
    {
      icon: <Zap className="text-brand-orange" size={32} />,
      title: "Expert Guidance",
      description: "Our team of experts provides technical advice to help you choose the right fittings for your specific needs."
    },
    {
      icon: <Truck className="text-brand-orange" size={32} />,
      title: "Fast Delivery",
      description: "We maintain a large inventory to ensure your orders are fulfilled and delivered without delay."
    },
    {
      icon: <Clock className="text-brand-orange" size={32} />,
      title: "24/7 Support",
      description: "Our customer support team is always available to assist you with your queries and orders."
    },
    {
      icon: <Star className="text-brand-orange" size={32} />,
      title: "Competitive Pricing",
      description: "We offer the best market rates without compromising on the quality of our products."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pt-32 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-orange font-bold text-xs uppercase tracking-widest mb-4 block"
          >
            Our Commitment
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight"
          >
            Why Choose <span className="text-brand-orange">Quality Fittings?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg max-w-3xl mx-auto"
          >
            We are more than just a hardware store. We are your partners in building durable and efficient plumbing systems.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-brand-orange/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 bg-brand-dark rounded-[3rem] p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to Experience the Best?</h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Quality Fittings for their plumbing and hardware needs.
            </p>
            <button 
              onClick={onBack}
              className="bg-brand-orange text-brand-dark px-10 py-4 rounded-2xl font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20"
            >
              Explore Products
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WhyUsPage;
