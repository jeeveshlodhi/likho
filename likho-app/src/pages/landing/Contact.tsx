import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Send, Mail, MessageSquare, CheckCircle, User, AtSign, ChevronDown, Sparkles } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const SUBJECTS = [
  { value: '', label: 'Select a subject' },
  { value: 'feedback', label: 'Product Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'support', label: 'Support Question' },
  { value: 'other', label: 'Other' },
];

const Contact = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef(null);
  const formRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFormInView = useInView(formRef, { once: true, margin: '-60px' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden scroll-smooth" style={{ backgroundColor: '#ffffff' }}>
      <Navbar scrollContainerRef={scrollContainerRef} />
      
      <main>
        {/* Hero Section - Matching Pricing Page Style */}
        <section
          ref={heroRef}
          className="relative pt-20 pb-0 overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 50% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.3) 70%, rgba(255,255,255,0) 100%)',
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                color: '#3f3f46',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <MessageSquare className="w-2.5 h-2.5 text-white" />
              </div>
              We'd love to hear from you
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-black tracking-[-0.04em] leading-[0.92] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}
            >
              <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>Get in</span>
              <span style={{ color: '#09090b', display: 'block', fontWeight: 900 }}>touch.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg mx-auto leading-relaxed"
              style={{ color: '#71717a', maxWidth: '46ch' }}
            >
              Have feedback, questions, or just want to say hello? Send us a message and we'll get back to you as soon as possible.
            </motion.p>
          </div>
        </section>

        {/* Form Section */}
        <section ref={formRef} className="py-24 lg:py-32 relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Dot pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.1) 100%)',
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={isFormInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
              }}
            >
              {/* Card Header */}
              <div className="px-8 py-6 border-b" style={{ borderColor: '#f4f4f5', backgroundColor: '#fafafa' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                    }}
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: '#09090b' }}>Send us a message</h3>
                    <p className="text-xs" style={{ color: '#a1a1aa' }}>We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
                      className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                      style={{ backgroundColor: '#dcfce7' }}
                    >
                      <CheckCircle className="w-8 h-8" style={{ color: '#16a34a' }} />
                    </motion.div>
                    <h4 className="text-lg font-bold mb-2" style={{ color: '#09090b' }}>
                      Message sent!
                    </h4>
                    <p className="text-sm mb-6" style={{ color: '#71717a' }}>
                      Thank you for reaching out. We'll get back to you soon.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: '#09090b',
                        color: '#fafafa',
                      }}
                    >
                      Send another
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#3f3f46' }}>
                          Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a1a1aa' }} />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
                            style={{
                              backgroundColor: '#fafafa',
                              border: '1px solid #e4e4e7',
                              color: '#09090b',
                            }}
                            placeholder="John Doe"
                            onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; e.target.style.backgroundColor = '#fafafa'; }}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#3f3f46' }}>
                          Email
                        </label>
                        <div className="relative">
                          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a1a1aa' }} />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
                            style={{
                              backgroundColor: '#fafafa',
                              border: '1px solid #e4e4e7',
                              color: '#09090b',
                            }}
                            placeholder="john@example.com"
                            onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; e.target.style.backgroundColor = '#fafafa'; }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold mb-2" style={{ color: '#3f3f46' }}>
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                          style={{
                            backgroundColor: '#fafafa',
                            border: '1px solid #e4e4e7',
                            color: '#09090b',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.backgroundColor = '#ffffff'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; e.target.style.backgroundColor = '#fafafa'; }}
                        >
                          {SUBJECTS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#a1a1aa' }} />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: '#3f3f46' }}>
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none resize-none"
                        style={{
                          backgroundColor: '#fafafa',
                          border: '1px solid #e4e4e7',
                          color: '#09090b',
                        }}
                        placeholder="Tell us what's on your mind..."
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; e.target.style.backgroundColor = '#fafafa'; }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: '#09090b',
                        color: '#fafafa',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Email Alternative */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isFormInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 text-center"
            >
              <p className="text-sm mb-4" style={{ color: '#a1a1aa' }}>
                Prefer email?
              </p>
              <a
                href="mailto:hello@likho.app"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  color: '#3f3f46',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <Mail className="w-4 h-4" style={{ color: '#6366f1' }} />
                hello@likho.app
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
