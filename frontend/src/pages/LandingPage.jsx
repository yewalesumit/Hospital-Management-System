import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiArrowRight, FiHeart, FiStar, FiClock,
  FiShield, FiUsers, FiCalendar, FiCheckCircle, FiPhone,
  FiMail, FiMapPin, FiChevronRight, FiAward, FiTrendingUp,
  FiMenu, FiX
} from 'react-icons/fi';
import { publicService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

/* ── Animated Counter ── */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = end / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const LandingPage = () => {
  const { isAuthenticated, isDoctor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [doctors,    setDoctors]    = useState([]);
  const [stats,      setStats]      = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 });
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [statsLoaded,setStatsLoaded]= useState(false);

  useEffect(() => {
    // Fetch doctors and real stats from backend
    Promise.all([
      publicService.getAllDoctors().catch(() => []),
      publicService.getStats().catch(() => ({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 })),
    ]).then(([docs, st]) => {
      setDoctors(docs);
      setStats(st);
      setStatsLoaded(true);
    });

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (isAdmin()) navigate('/admin/dashboard');
      else if (isDoctor()) navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } else navigate('/login');
  };

  // Hero doctor card — use first real doctor if available, else fallback
  const heroDoctor = doctors[0] || null;

  // Build unique specialties from real doctor data, merged with defaults
  const defaultSpecialties = [
    { icon: '🫀', name: 'Cardiology',    desc: 'Heart & vascular care' },
    { icon: '🧠', name: 'Neurology',     desc: 'Brain & nerve disorders' },
    { icon: '🦴', name: 'Orthopedics',   desc: 'Bone & joint treatment' },
    { icon: '👁️', name: 'Ophthalmology', desc: 'Eye care & surgery' },
    { icon: '🦷', name: 'Dentistry',     desc: 'Oral health & hygiene' },
    { icon: '🧬', name: 'Oncology',      desc: 'Cancer treatment' },
  ];
  const specialtyIcons = { '🫀': ['cardio'], '🧠': ['neuro'], '🦴': ['ortho','bone'], '👁️': ['eye','ophthal'], '🦷': ['dent','oral'], '🧬': ['onco','cancer'], '🩺': ['general','medicine'], '🏥': [] };
  const liveSpecialties = doctors.length > 0
    ? [...new Map([
        ...defaultSpecialties,
        ...doctors.map(d => ({
          icon: Object.entries(specialtyIcons).find(([,keys]) => keys.some(k => d.specialization?.toLowerCase().includes(k)))?.[0] || '🩺',
          name: d.specialization,
          desc: `Expert ${d.specialization} care`,
        })),
      ].map(s => [s.name, s])).values()].slice(0, 6)
    : defaultSpecialties;

  const testimonials = [
    { name: 'Priya Sharma', role: 'Patient', text: 'MediCare made booking appointments so easy. The doctors are extremely professional and caring.', rating: 5, avatar: 'PS' },
    { name: 'Rahul Mehta',  role: 'Patient', text: 'Outstanding service! I was able to consult with a specialist within hours. Highly recommended.', rating: 5, avatar: 'RM' },
    { name: 'Anita Patel',  role: 'Patient', text: 'The online portal is intuitive and saves so much time. My health records are always accessible.', rating: 5, avatar: 'AP' },
  ];

  const steps = [
    { num: '01', icon: <FiUsers size={24}/>,       title: 'Create Account',   desc: 'Sign up in seconds with your email or Google account.' },
    { num: '02', icon: <FiCalendar size={24}/>,    title: 'Book Appointment', desc: 'Choose your doctor, pick a date and time that suits you.' },
    { num: '03', icon: <FiCheckCircle size={24}/>, title: 'Pay Securely',     desc: 'Pay your consultation fee safely via Razorpay.' },
    { num: '04', icon: <FiHeart size={24}/>,       title: 'Get Treated',      desc: 'Meet your doctor and receive the best care possible.' },
  ];

  return (
    <div className="landing">

      {/* ── NAVBAR ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-brand">
          <div className="landing-logo"><FiActivity size={22}/></div>
          <span className="landing-brand-text">MediCare</span>
        </div>
        <div className={`landing-nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="#features"     className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#specialties"  className="nav-link" onClick={() => setMenuOpen(false)}>Specialties</a>
          <a href="#doctors"      className="nav-link" onClick={() => setMenuOpen(false)}>Doctors</a>
          <a href="#how-it-works" className="nav-link" onClick={() => setMenuOpen(false)}>How it Works</a>
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={handleGetStarted} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Go to Dashboard &nbsp;<FiChevronRight/>
            </button>
          ) : (
            <>
              <Link to="/login"  className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={22}/> : <FiMenu size={22}/>}
        </button>
      </nav>


      {/* ── HERO ── */}
      <header className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"/><div className="shape shape-2"/>
          <div className="shape shape-3"/><div className="shape shape-4"/>
        </div>
        <div className="hero-content animate-slide-up">
          <div className="hero-badge">
            <span className="badge-dot"/>&nbsp;Trusted by 10,000+ Patients
          </div>
          <h1 className="hero-title">
            Your Health,<br/>
            <span className="hero-title-gradient">Our Priority</span>
          </h1>
          <p className="hero-subtitle">
            Book appointments with top specialists, manage your health records,
            and receive world-class care — all from one platform.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={handleGetStarted}>
              Book Appointment &nbsp;<FiArrowRight/>
            </button>
            <a href="#how-it-works" className="btn-hero-ghost">
              How it Works &nbsp;<FiChevronRight/>
            </a>
          </div>
          <div className="hero-trust">
            <div className="trust-avatars">
              {['A','B','C','D'].map(l => <div key={l} className="trust-avatar">{l}</div>)}
            </div>
            <div className="trust-text">
              <div className="trust-stars">{'★'.repeat(5)}</div>
              <span>4.9/5 from 2,000+ reviews</span>
            </div>
          </div>
        </div>
        <div className="hero-visual animate-fade">
          <div className="hero-card-main">
            <div className="hcard-header">
              <div className="hcard-avatar"><FiHeart size={20} color="#fff"/></div>
              <div>
                <div className="hcard-name">{heroDoctor ? `Dr. ${heroDoctor.name}` : 'Dr. Aryan Kapoor'}</div>
                <div className="hcard-spec">{heroDoctor ? heroDoctor.specialization : 'Cardiologist'}</div>
              </div>
              <div className="hcard-badge">Available</div>
            </div>
            <div className="hcard-divider"/>
            <div className="hcard-stats">
              <div className="hcard-stat"><span>12+ yrs</span><small>Experience</small></div>
              <div className="hcard-stat"><span>4.9 ⭐</span><small>Rating</small></div>
              <div className="hcard-stat"><span>500+</span><small>Patients</small></div>
            </div>
            <button className="hcard-btn" onClick={handleGetStarted}>Book Now &nbsp;<FiArrowRight size={14}/></button>
          </div>
          <div className="hero-card-float float-1">
            <FiCheckCircle size={16} color="#16a34a"/>
            <span>Appointment Confirmed!</span>
          </div>
          <div className="hero-card-float float-2">
            <FiShield size={16} color="#4f46e5"/>
            <span>Secure Payment</span>
          </div>
          <div className="hero-card-float float-3">
            <FiClock size={16} color="#d97706"/>
            <span>Today, 3:30 PM</span>
          </div>
          <div className="hero-blob"/>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="stats-section">
        {[
          { value: statsLoaded ? stats.totalPatients     : 0,  realVal: stats.totalPatients,     suffix: '+', label: 'Patients Served',   icon: <FiUsers size={20}/> },
          { value: statsLoaded ? stats.totalDoctors      : 0,  realVal: stats.totalDoctors,      suffix: '+', label: 'Expert Doctors',    icon: <FiAward size={20}/> },
          { value: statsLoaded ? stats.totalAppointments : 0,  realVal: stats.totalAppointments, suffix: '+', label: 'Appointments Done', icon: <FiCalendar size={20}/> },
          { value: 98, realVal: 98, suffix: '%', label: 'Satisfaction Rate', icon: <FiTrendingUp size={20}/> },
        ].map(({ value, suffix, label, icon }) => (
          <div className="stat-item" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value"><Counter end={value} suffix={suffix}/></div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-badge">Why MediCare?</div>
          <h2 className="section-title">Everything You Need<br/>In One Place</h2>
          <p className="section-subtitle">Modern healthcare management designed for patients, doctors, and administrators.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: <FiClock size={26}/>,    color: '#4f46e5', bg: '#eef2ff', title: '24/7 Access',        desc: 'Book appointments and access records anytime, day or night, from any device.' },
            { icon: <FiShield size={26}/>,   color: '#0891b2', bg: '#e0f2fe', title: 'Secure & Private',   desc: 'Your medical data is encrypted and protected with enterprise-grade security.' },
            { icon: <FiHeart size={26}/>,    color: '#16a34a', bg: '#dcfce7', title: 'Expert Specialists', desc: 'Connect with highly qualified specialists across 25+ medical departments.' },
            { icon: <FiStar size={26}/>,     color: '#d97706', bg: '#fef3c7', title: 'Seamless Payments',  desc: 'Pay consultation fees instantly and securely via Razorpay — card, UPI, or netbanking.' },
            { icon: <FiActivity size={26}/>, color: '#dc2626', bg: '#fee2e2', title: 'Health Analytics',   desc: 'Track your health history and appointment patterns with smart insights.' },
            { icon: <FiCalendar size={26}/>, color: '#7c3aed', bg: '#f3e8ff', title: 'Smart Scheduling',   desc: 'Intelligent appointment scheduling that fits your busy lifestyle perfectly.' },
          ].map(({ icon, color, bg, title, desc }) => (
            <div className="feature-card-new" key={title}>
              <div className="feature-icon-new" style={{ background: bg, color }}>{icon}</div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
              <div className="feature-arrow" style={{ color }}><FiArrowRight size={16}/></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <section className="specialties-section" id="specialties">
        <div className="section-header">
          <div className="section-badge">Our Departments</div>
          <h2 className="section-title">Medical Specialties</h2>
          <p className="section-subtitle">World-class care across all major medical disciplines.</p>
        </div>
        <div className="specialties-grid">
          {liveSpecialties.map(({ icon, name, desc }) => (
            <div className="specialty-card" key={name} onClick={handleGetStarted}>
              <div className="specialty-icon">{icon}</div>
              <div className="specialty-name">{name}</div>
              <div className="specialty-desc">{desc}</div>
              <div className="specialty-arrow"><FiChevronRight size={16}/></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOCTORS ── */}
      <section className="doctors-section" id="doctors">
        <div className="section-header">
          <div className="section-badge">Our Team</div>
          <h2 className="section-title">Meet Our Specialists</h2>
          <p className="section-subtitle">
            {doctors.length > 0
              ? `${doctors.length} qualified doctors ready to serve you.`
              : 'Experienced doctors dedicated to your well-being.'}
          </p>
        </div>
        <div className="doctors-grid">
          {doctors.length > 0
            ? doctors.slice(0, 4).map((doc, i) => (
                <div className="doctor-card-new" key={doc.id}>
                  <div className="doctor-avatar-new" style={{ background: `hsl(${i * 60 + 200},70%,55%)` }}>
                    {doc.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="doctor-info">
                    <div className="doctor-name-new">Dr. {doc.name}</div>
                    <div className="doctor-spec-new">{doc.specialization}</div>
                    <div className="doctor-meta">
                      <span>⭐ 4.{8 + i % 2}</span>
                      <span>·</span>
                      <span className="doctor-available">Available</span>
                    </div>
                  </div>
                  <button className="doctor-book-btn" onClick={handleGetStarted}>Book</button>
                </div>
              ))
            : /* Skeleton placeholders while loading */
              [1, 2, 3, 4].map(n => (
                <div className="doctor-card-new skeleton-card" key={n}>
                  <div className="skeleton-avatar"/>
                  <div className="doctor-info">
                    <div className="skeleton-line skeleton-name"/>
                    <div className="skeleton-line skeleton-spec"/>
                    <div className="skeleton-line skeleton-meta"/>
                  </div>
                </div>
              ))
          }
        </div>
        {doctors.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="btn-hero-primary" onClick={handleGetStarted}>
              View All {doctors.length} Doctors &nbsp;<FiArrowRight/>
            </button>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <div className="section-badge">Simple Process</div>
          <h2 className="section-title">Get Care in 4 Easy Steps</h2>
          <p className="section-subtitle">From registration to treatment — it's fast, easy, and secure.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ num, icon, title, desc }, i) => (
            <div className="step-card" key={num}>
              <div className="step-num">{num}</div>
              <div className="step-icon">{icon}</div>
              <h3 className="step-title">{title}</h3>
              <p className="step-desc">{desc}</p>
              {i < steps.length - 1 && <div className="step-connector"/>}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="section-header">
          <div className="section-badge">Patient Reviews</div>
          <h2 className="section-title">What Our Patients Say</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map(({ name, role, text, rating, avatar }) => (
            <div className="testimonial-card" key={name}>
              <div className="testimonial-stars">{'⭐'.repeat(rating)}</div>
              <p className="testimonial-text">"{text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{avatar}</div>
                <div>
                  <div className="testimonial-name">{name}</div>
                  <div className="testimonial-role">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-blob-1"/><div className="cta-blob-2"/>
        <div className="cta-content">
          <h2 className="cta-title">Ready to Take Control<br/>of Your Health?</h2>
          <p className="cta-subtitle">Join thousands of patients who trust MediCare for their healthcare needs.</p>
          <div className="cta-actions">
            <button className="btn-hero-primary light" onClick={handleGetStarted}>
              Get Started Free &nbsp;<FiArrowRight/>
            </button>
            <Link to="/login" className="btn-hero-ghost light">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="landing-brand" style={{ marginBottom:'16px' }}>
              <div className="landing-logo"><FiActivity size={20}/></div>
              <span className="landing-brand-text" style={{ fontSize:'20px', WebkitTextFillColor:'#fff', color:'#fff' }}>MediCare</span>
            </div>
            <p className="footer-tagline">Modern healthcare management for everyone.</p>
            <div className="footer-social">
              <div className="social-icon"><FiPhone size={14}/></div>
              <div className="social-icon"><FiMail size={14}/></div>
              <div className="social-icon"><FiMapPin size={14}/></div>
            </div>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <div className="footer-col-title">Platform</div>
              <a className="footer-link" onClick={handleGetStarted}>Book Appointment</a>
              <a className="footer-link" href="#doctors">Find Doctors</a>
              <a className="footer-link" href="#specialties">Specialties</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Company</div>
              <a className="footer-link" href="#">About Us</a>
              <a className="footer-link" href="#">Careers</a>
              <a className="footer-link" href="#">Contact</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Legal</div>
              <a className="footer-link" href="#">Privacy Policy</a>
              <a className="footer-link" href="#">Terms of Service</a>
              <a className="footer-link" href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 MediCare Hospital Management System. All rights reserved.</p>
          <p>Built with ❤️ for better healthcare</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
