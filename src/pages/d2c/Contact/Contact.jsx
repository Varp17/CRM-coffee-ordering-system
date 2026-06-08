import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Message sent! We\'ll reply within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="contact-page">

      {/* Hero */}
      <section className="contact-hero">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="contact-hero-inner"
          >
            <span className="eyebrow">Get in Touch</span>
            <h1>We're Here to Help</h1>
            <p>Questions about your order, our coffee, or subscriptions? We reply within 24 hours.</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="contact-section section-pad">
        <div className="section-container contact-grid">

          {/* Contact Info */}
          <div className="contact-info-col">
            <h2>Reach Us</h2>
            <div className="contact-info-items">
              <a href="mailto:hello@digitalcoffee.in" className="contact-info-item">
                <div className="ci-icon"><Mail size={18} /></div>
                <div>
                  <strong>Email</strong>
                  <span>hello@digitalcoffee.in</span>
                </div>
              </a>
              <a href="tel:+918001234567" className="contact-info-item">
                <div className="ci-icon"><Phone size={18} /></div>
                <div>
                  <strong>WhatsApp / Phone</strong>
                  <span>+91 80 0123 4567</span>
                </div>
              </a>
              <div className="contact-info-item">
                <div className="ci-icon"><MapPin size={18} /></div>
                <div>
                  <strong>Based in</strong>
                  <span>Bengaluru, Karnataka, India</span>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="ci-icon"><Clock size={18} /></div>
                <div>
                  <strong>Support Hours</strong>
                  <span>Mon–Sat, 9am – 7pm IST</span>
                </div>
              </div>
            </div>

            <div className="contact-social">
              <p>Follow us</p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg> Instagram
                </a>
                <a href="#" className="social-link" aria-label="Twitter / X">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46L20 4"/></svg> Twitter
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-col">
            <div className="contact-form-card">
              <h2>Send a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="contact-name">Your Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Rahul Mehra"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="contact-email">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="contact-subject">Subject</label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    required
                  >
                    <option value="">Select a topic…</option>
                    <option>Order Issue</option>
                    <option>Subscription Help</option>
                    <option>Product Question</option>
                    <option>Wholesale Enquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us what's on your mind…"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="contact-submit"
                  id="contact-submit-btn"
                  disabled={sending}
                >
                  {sending ? 'Sending…' : <>Send Message <Send size={15} /></>}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Contact;
