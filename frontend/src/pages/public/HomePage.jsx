import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Cross,
  FileText,
  HeartPulse,
  Pill,
  Play,
  ShieldPlus,
  UserRound
} from "lucide-react";
import { Link } from "react-router-dom";
import healthGuardLogo from "../../assets/logo.png";

const quickAccessItems = [
  { value: "Book", label: "Appointment" },
  { value: "Lab", label: "Results" },
  { value: "Pharmacy", label: "Services" },
  { value: "Bills", label: "& Receipts" }
];

const patientServices = [
  {
    id: "appointment",
    name: "Book an Appointment",
    icon: CalendarCheck,
    desc: "View available appointment times and book a visit with a doctor that suits your schedule.",
    action: "Book Now",
    to: "/register"
  },
  {
    id: "lab-results",
    name: "Laboratory Results",
    icon: FileText,
    desc: "Check the progress of requested laboratory tests and access completed reports online.",
    action: "View Results",
    to: "/login"
  },
  {
    id: "pharmacy",
    name: "Pharmacy Services",
    icon: Pill,
    desc: "Keep your prescriptions connected with the medical center pharmacy and medicine services.",
    action: "Learn More",
    to: "/login"
  },
  {
    id: "billing",
    name: "Bills & Payments",
    icon: CreditCard,
    desc: "View your invoices, outstanding balances, payments and receipts in one place.",
    action: "View Billing",
    to: "/login"
  },
  {
    id: "account",
    name: "My Health Guard Account",
    icon: UserRound,
    desc: "Manage your profile, appointments and medical-center information through your personal account.",
    action: "Open Account",
    to: "/login"
  }
];

const portalFeatures = [
  {
    name: "My Appointments",
    icon: CalendarCheck,
    desc: "View upcoming and previous appointments."
  },
  {
    name: "Lab Reports",
    icon: FileText,
    desc: "Access completed laboratory results."
  },
  {
    name: "My Bills",
    icon: CreditCard,
    desc: "View invoices and outstanding balances."
  },
  {
    name: "My Receipts",
    icon: CheckCircle2,
    desc: "Keep a record of completed payments."
  }
];

export const HomePage = () => (
  <div className="home-page">
    <div className="hero-wrapper">
      <section className="hero-section">
        <div className="hero-visual-bg" aria-hidden="true" />

        <div className="hero-copy">
          <div className="hero-pill-badge">
            <ShieldPlus size={16} />
            <span>Health Guard Medical Center</span>
          </div>

          <h1>Your health. Your care. All in one place.</h1>

          <p className="hero-desc">
            Book appointments, access your medical information, view laboratory results, manage
            prescriptions and keep track of your payments through Health Guard.
          </p>

          <div className="hero-actions">
            <Link className="button-primary" to="/register">
              Book an Appointment
            </Link>
            <Link className="button-secondary" to="/login">
              Login
            </Link>
          </div>

          <Link className="watch-button" to="/register">
            <span className="watch-play-icon">
              <Play size={18} fill="currentColor" />
            </span>
            <span>New patient? Create an account</span>
          </Link>
        </div>

        <div className="hero-badge-float">
          <div className="patient-avatar-stack">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Patient"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
              alt="Patient"
            />
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              alt="Patient"
            />
          </div>
          <div className="badge-text">
            <strong>4</strong>
            <small>Quick Services</small>
          </div>
          <div className="badge-verified-icon">
            <Check size={14} strokeWidth={3} />
          </div>
        </div>

        <div className="stats-ribbon-container">
          <div className="stats-ribbon">
            {quickAccessItems.map((item) => (
              <div className="stat-item" key={`${item.value}-${item.label}`}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>

    <section className="about-section" id="about">
      <div className="about-bg-curve" aria-hidden="true" />
      <div className="about-copy">
        <span className="section-eyebrow">About Health Guard</span>
        <h2>Care made simpler for every visit</h2>
        <p>
          Health Guard helps patients manage their medical center services more conveniently. From
          booking an appointment to checking laboratory results and viewing payments, important
          information is available through one secure account.
        </p>

        <div className="about-highlights">
          <div className="highlight-card">
            <div className="highlight-icon">
              <CalendarCheck size={18} />
            </div>
            <div>
              <strong>Easy Appointments</strong>
              <span>Choose an available doctor and appointment time online.</span>
            </div>
          </div>
          <div className="highlight-card">
            <div className="highlight-icon">
              <Clock size={18} />
            </div>
            <div>
              <strong>Your Records</strong>
              <span>Keep track of appointments, laboratory reports and payments.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="about-visual">
        <div className="about-image-card">
          <img
            src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1000&q=85"
            alt="Medical team supporting patient care"
          />
        </div>
        <div className="about-floating-tag">
          <HeartPulse size={24} color="#0284C7" />
          <div>
            <strong>Patient Account</strong>
            <span>Your visit information in one place</span>
          </div>
        </div>
      </div>
    </section>

    <section className="departments-section" id="services">
      <div className="departments-header">
        <span className="section-eyebrow">Patient Services</span>
        <h2>Everything you need for your visit</h2>
      </div>

      <div className="departments-grid modules-grid">
        {patientServices.map((service) => {
          const Icon = service.icon;
          return (
            <Link className="department-card module-card" key={service.id} to={service.to}>
              <div className="dept-icon-wrapper">
                <Icon size={32} />
              </div>
              <div className="dept-info">
                <h3>{service.name}</h3>
                <p>{service.desc}</p>
                <div className="feature-tags">
                  <span>{service.action}</span>
                </div>
              </div>
              <ArrowRight className="dept-arrow" size={20} />
            </Link>
          );
        })}
      </div>
    </section>

    <section className="departments-section workflow-section">
      <div className="departments-header">
        <span className="section-eyebrow">Need An Appointment?</span>
        <h2>Plan your next visit with Health Guard</h2>
        <p className="section-description">
          Create your patient account, check available appointment times and book your visit online.
        </p>
      </div>
      <div className="workflow-card">
        <div className="hero-actions">
          <Link className="button-primary" to="/register">
            Book Appointment
          </Link>
          <Link className="button-secondary" to="/register">
            Create Account
          </Link>
        </div>
      </div>
    </section>

    <section className="departments-section roles-section">
      <div className="departments-header">
        <span className="section-eyebrow">Your Patient Portal</span>
        <h2>Your medical center information, available when you need it</h2>
      </div>
      <div className="departments-grid modules-grid">
        {portalFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div className="department-card module-card" key={feature.name}>
              <div className="dept-icon-wrapper">
                <Icon size={32} />
              </div>
              <div className="dept-info">
                <h3>{feature.name}</h3>
                <p>{feature.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    <section className="departments-section">
      <div className="workflow-card">
        <div className="departments-header" style={{ marginBottom: 0 }}>
          <span className="section-eyebrow">Health Guard Staff</span>
          <h2>Are you a Health Guard staff member?</h2>
          <p className="section-description">
            Access your staff portal to manage your assigned tasks and medical-center services.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button-secondary" to="/login">
            Staff Login
          </Link>
        </div>
      </div>
    </section>

    <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 28px" }}>
      <section className="care-band" id="contact">
        <div className="care-band-copy">
          <div className="care-band-icon">
            <Cross size={28} />
          </div>
          <div>
            <h2>Ready for your next visit?</h2>
            <p>Book an appointment or sign in to manage your Health Guard patient account.</p>
          </div>
        </div>
        <div className="care-icons">
          <Link className="care-icon-pill" title="Book Appointment" to="/register">
            <CalendarCheck size={22} />
          </Link>
          <Link className="care-icon-pill" title="Login" to="/login">
            <UserRound size={22} />
          </Link>
          <Link className="care-icon-pill" title="Pharmacy" to="/login">
            <Pill size={22} />
          </Link>
          <Link className="care-icon-pill" title="Billing" to="/login">
            <CreditCard size={22} />
          </Link>
        </div>
      </section>
    </div>

    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img className="footer-logo" src={healthGuardLogo} alt="Health Guard Medical Center" />
          <p>Making appointments and medical-center services easier to access for our patients.</p>
        </div>
        <div className="footer-col">
          <h5>Patient Services</h5>
          <ul>
            <li><Link to="/register">Book Appointment</Link></li>
            <li><Link to="/login">My Appointments</Link></li>
            <li><Link to="/login">Lab Results</Link></li>
            <li><Link to="/login">Bills & Payments</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Account</h5>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Patient Registration</Link></li>
            <li><Link to="/login">Staff Login</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Information</h5>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2026 Health Guard Medical Center</span>
      </div>
    </footer>
  </div>
);
