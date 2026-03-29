import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, Clock, Headphones, MessageSquare, Instagram, Facebook, Twitter } from 'lucide-react';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct WhatsApp message
    const waMessage = encodeURIComponent(
      `*New Inquiry from Quality Fittings Website*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Email:* ${formData.email}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Message:* ${formData.message}`
    );
    
    const waNumber = "919720356263";
    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(waUrl, '_blank');

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 1000);
  };

  const contactInfo = [
    {
      icon: <Phone className="text-brand-orange" size={24} />,
      title: "Call Us",
      value: "+91 97203 56263",
      sub: "Mon-Sat, 9am-8pm"
    },
    {
      icon: <Mail className="text-brand-orange" size={24} />,
      title: "Email Us",
      value: "anshsinghal1500@gmail.com",
      sub: "We'll reply within 24h"
    },
    {
      icon: <MapPin className="text-brand-orange" size={24} />,
      title: "Visit Us",
      value: "Dankaur Jhajjhar Road",
      sub: "Gautam Buddh Nagar, Uttar Pradesh"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white pt-32 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-orange font-bold text-xs uppercase tracking-widest mb-4 block"
          >
            Get In Touch
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight"
          >
            Let's Start a <span className="text-brand-orange">Conversation</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg max-w-3xl mx-auto"
          >
            Have questions about our products or need a custom quote? Our team is here to help you with everything you need.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            {contactInfo.map((info, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-start gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-orange/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-brand-orange/10 transition-colors shrink-0">
                  {info.icon}
                </div>
                <div>
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{info.title}</h3>
                  <div className="text-slate-900 font-bold text-lg mb-1">{info.value}</div>
                  <div className="text-slate-500 text-sm">{info.sub}</div>
                </div>
              </motion.div>
            ))}

            <div className="p-8 rounded-3xl bg-brand-dark text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-all"><Instagram size={20} /></a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-all"><Facebook size={20} /></a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-all"><Twitter size={20} /></a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                    <Send size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">Message Sent!</h2>
                  <p className="text-slate-500 text-lg mb-8">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-brand-orange font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Your Message</label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="How can we help you today?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange/50 transition-all resize-none"
                    ></textarea>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-brand-orange text-brand-dark py-5 rounded-2xl font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-4 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactUsPage;
