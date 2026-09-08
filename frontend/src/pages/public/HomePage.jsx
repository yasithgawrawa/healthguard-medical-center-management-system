import {
  Activity,
  Baby,
  Brain,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  HeartPulse,
  Pill,
  Play,
  Siren,
  Stethoscope
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  ["Emergency Department", Siren],
  ["Pediatric Department", Baby],
  ["Cardiology Department", HeartPulse],
  ["Neurology Department", Activity],
  ["Psychiatry Department", Brain],
  ["Clinical Billing", CreditCard]
];

const stats = [
  ["20+", "Years of experience"],
  ["95%", "Patient satisfaction"],
  ["5000+", "Patients served annually"],
  ["10+", "Healthcare roles unified"]
];

export const HomePage = () => (
  <div className="home-page">
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Health Guard Medical Center</p>
        <h1>Compassionate care, exceptional results</h1>
        <p>
          An integrated medical center platform for appointments, clinical care, inventory, billing and workforce management.
        </p>
        <div className="hero-actions">
          <Link className="button-primary" to="/register">Patient Registration</Link>
          <Link className="button-secondary" to="/login">Login</Link>
        </div>
        <button className="watch-button" type="button">
          <Play size={18} />
          <span>See how we work</span>
        </button>
      </div>
      <div className="hero-badge">
        <div className="patient-stack">
          <span />
          <span />
          <span />
        </div>
        <strong>150K +</strong>
        <small>Patient Recover</small>
        <CheckCircle2 size={22} />
      </div>
      <div className="stats-ribbon">
        {stats.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>

    <section className="about-section" id="about">
      <div>
        <p className="eyebrow dark">About Us</p>
        <h2>Health Guard is a team of experienced medical professionals</h2>
        <p>
          Dedicated to safer and faster care, our system connects patients, doctors, nurses, pharmacists, cashiers and managers through one secure workflow.
        </p>
      </div>
      <img
        src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=85"
        alt="Medical team caring for a patient"
      />
    </section>

    <section className="departments-section" id="services">
      <p className="eyebrow dark">Our Departments</p>
      <h2>For Your Health</h2>
      <div className="service-grid">
        {services.map(([name, Icon]) => (
          <article className="service-card" key={name}>
            <Icon size={36} />
            <h3>{name}</h3>
          </article>
        ))}
      </div>
    </section>

    <section className="care-band" id="contact">
      <div>
        <FlaskConical size={30} />
        <h2>Coordinated care from arrival to receipt</h2>
        <p>No. 24 Wellness Road, Colombo | contact@healthguard.local | +94 11 555 0101</p>
      </div>
      <div className="care-icons">
        <CalendarCheck />
        <Stethoscope />
        <Pill />
      </div>
    </section>
  </div>
);
