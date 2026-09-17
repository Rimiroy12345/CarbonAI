import React, { useState } from 'react';

import {
  submitAssessment,
  signIn,
  signOut,
} from './services/api';

import Dashboard from './pages/Dashboard';
import carbonAIImage from './assets/carbon-ai.png';
import './App.css';

const emissionFields = [
  { key: 'electricity', label: 'Electricity consumption', unit: 'kWh / year', placeholder: 'e.g. 10000', category: '⚡ Energy' },
  { key: 'naturalGas', label: 'Natural gas', unit: 'm³ / year', placeholder: 'e.g. 5000', category: '⚡ Energy' },
  { key: 'petrol', label: 'Petrol', unit: 'litres / year', placeholder: 'e.g. 2500', category: '⛽ Fuel' },
  { key: 'diesel', label: 'Diesel', unit: 'litres / year', placeholder: 'e.g. 3000', category: '⛽ Fuel' },
  { key: 'flights', label: 'Air travel', unit: 'km / year', placeholder: 'e.g. 50000', category: '✈️ Business travel' },
  { key: 'hotels', label: 'Hotel stays', unit: 'nights / year', placeholder: 'e.g. 500', category: '✈️ Business travel' },
  { key: 'commuting', label: 'Employee commuting', unit: 'km / year', placeholder: 'e.g. 120000', category: '🚗 Commuting & Waste' },
  { key: 'waste', label: 'Waste generated', unit: 'kg / year', placeholder: 'e.g. 5000', category: '🚗 Commuting & Waste' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('access_token'))
  );
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  const [activeTab, setActiveTab] = useState('landing');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState({
    name: '',
    industry: '',
    employees: '',
    location: '',
  });
  const [emissions, setEmissions] = useState({
    electricity: '',
    naturalGas: '',
    petrol: '',
    diesel: '',
    flights: '',
    hotels: '',
    commuting: '',
    waste: '',
  });
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [assessmentResult, setAssessmentResult] = useState(null);

  const updateCompany = (field, value) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  const updateEmissions = (field, value) => {
    setEmissions((prev) => ({ ...prev, [field]: value }));
  };

  const goToLandingSection = (sectionId) => {
    setStep(1);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openSignIn = () => {
    setSignInError('');
    setSignInEmail('');
    setSignInPassword('');
    setShowSignIn(true);
  };

  const closeSignIn = () => {
    if (signInLoading) return;
    setShowSignIn(false);
    setSignInError('');
  };

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }
    setActiveTab('landing');
    setStep(2);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setSignInError('');

    const email = signInEmail.trim();
    const password = signInPassword;
    if (!email || !password) {
      setSignInError('Please enter your email and password.');
      return;
    }

    setSignInLoading(true);
    try {
      await signIn(email, password);
      setIsLoggedIn(true);
      setShowSignIn(false);
      setSignInEmail('');
      setSignInPassword('');
      setActiveTab('landing');
      setStep(2);
    } catch (error) {
      console.error('Sign in error:', error);
      setSignInError(
        error?.message || 'Sign in failed. Please check your email and password.'
      );
    } finally {
      setSignInLoading(false);
    }
  };

  const handleDashboardAccess = () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    signOut();
    setIsLoggedIn(false);
    setActiveTab('landing');
    setStep(1);
    setCompany({ name: '', industry: '', employees: '', location: '' });
    setEmissions({
      electricity: '',
      naturalGas: '',
      petrol: '',
      diesel: '',
      flights: '',
      hotels: '',
      commuting: '',
      waste: '',
    });
    setAiRecommendation('');
    setAssessmentResult(null);
  };

  const handleCalculate = async () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }

    setLoading(true);

    const payload = {
      company_name: company.name,
      industry: company.industry || 'general',
      employee_count: company.employees
        ? parseInt(company.employees, 10)
        : null,
      location: company.location || null,
      electricity: parseFloat(emissions.electricity) || 0,
      natural_gas: parseFloat(emissions.naturalGas) || 0,
      petrol: parseFloat(emissions.petrol) || 0,
      diesel: parseFloat(emissions.diesel) || 0,
      air_travel: parseFloat(emissions.flights) || 0,
      hotels: parseFloat(emissions.hotels) || 0,
      commuting: parseFloat(emissions.commuting) || 0,
      waste: parseFloat(emissions.waste) || 0,
    };

    try {
      const response = await submitAssessment(payload);
      setAssessmentResult(response);
      setAiRecommendation(
        response?.recommendation || response?.aiRecommendation || ''
      );
      setStep(4);
    } catch (error) {
      console.error('Calculation failed:', error);
      alert(
        error?.response?.data?.detail ||
        'Calculation failed. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalTco2e = Number(assessmentResult?.total_tco2e ?? 0);
  const breakdownPct = assessmentResult?.breakdown_pct || {};
  const energyPct = Number(breakdownPct.energy ?? 0);
  const transportPct = Number(breakdownPct.transport ?? 0);
  const wastePct = Number(breakdownPct.waste ?? 0);

  const largestSource = Object.entries({
    Energy: energyPct,
    Transport: transportPct,
    Waste: wastePct,
  }).reduce((max, item) => (item[1] > max[1] ? item : max), ['Energy', 0]);

  return (
    <div className="app">
      <nav className="carbonai-navbar">
        <button
          type="button"
          className="carbonai-logo"
          onClick={() => {
            setActiveTab('landing');
            goToLandingSection('home');
          }}
        >
          <span className="logo-mark">◈</span>
          Carbon<span>AI</span>
        </button>

        <div className="carbonai-nav-links">
          {['how', 'features', 'impact', 'about'].map((section, index) => {
            const labels = ['How it works', 'Features', 'Impact', 'About'];
            return (
              <button
                key={section}
                type="button"
                onClick={() => {
                  setActiveTab('landing');
                  goToLandingSection(section);
                }}
              >
                {labels[index]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleDashboardAccess}
            className={`carbonai-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>

          {!isLoggedIn ? (
            <button type="button" className="carbonai-signin" onClick={openSignIn}>
              Sign in <span>→</span>
            </button>
          ) : (
            <button type="button" className="carbonai-signin" onClick={handleLogout}>
              Sign out <span>→</span>
            </button>
          )}
        </div>
      </nav>

      {activeTab === 'dashboard' ? (
        <Dashboard
          company={company}
          emissions={emissions}
          aiRecommendation={aiRecommendation}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {step === 1 && (
            <main className="carbonai-landing">
              <section className="carbonai-hero" id="home">
                <div className="carbonai-hero-glow" />
                <div className="carbonai-hero-text">
                  <div className="carbonai-eyebrow">A CLEANER TOMORROW, POWERED BY AI</div>
                  <h1>
                    Measure today.
                    <br />
                    <em>A greener</em>
                    <br />
                    tomorrow.
                  </h1>
                  <p>
                    CarbonAI helps businesses understand their carbon footprint, identify emission
                    hotspots, and discover smarter AI-driven ways to reduce their environmental impact.
                  </p>
                  <div className="carbonai-hero-buttons">
                    <button type="button" className="carbonai-primary" onClick={handleGetStarted}>
                      Get started <span>→</span>
                    </button>
                  </div>
                  <div className="carbonai-stats">
                    <div><strong>500+</strong><span>Businesses onboarded</span></div>
                    <div><strong>2.8M</strong><span>tCO₂e analysed</span></div>
                    <div><strong>28%</strong><span>Average reduction potential</span></div>
                  </div>
                </div>
                <div className="carbonai-visual">
                  <div className="carbonai-image-glow" />
                  <div className="carbonai-image-wrap">
                    <img src={carbonAIImage} alt="CarbonAI sustainable future" className="carbonai-image" />
                  </div>
                </div>
              </section>

              <section className="carbonai-trust">
                <p>TRUSTED BY FORWARD-THINKING COMPANIES</p>
                <div className="carbonai-trust-logos">
                  <span>Google</span><span>Microsoft</span><span>TATA</span><span>Infosys</span><span>Reliance</span>
                </div>
              </section>

              <section className="carbonai-how" id="how">
                <div className="carbonai-label">HOW IT WORKS</div>
                <h2>From data to <em>real impact.</em></h2>
                <p className="carbonai-description">
                  A simple process. A significant difference. Turn your business data into a cleaner, greener future.
                </p>
                <div className="carbonai-process">
                  {[
                    ['01', '◫', 'Measure', 'Input your business activity data across key emission sources.'],
                    ['02', '◌', 'Understand', 'Identify your biggest emission hotspots with AI-powered analysis.'],
                    ['03', '◇', 'Take action', 'Get tailored recommendations to reduce your carbon footprint.'],
                  ].map(([number, icon, title, description], index) => (
                    <React.Fragment key={number}>
                      <div className="carbonai-process-card">
                        <span className="carbonai-process-number">{number}</span>
                        <div className="carbonai-process-icon">{icon}</div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>
                      {index < 2 && <div className="carbonai-process-arrow">→</div>}
                    </React.Fragment>
                  ))}
                </div>
              </section>

              <section className="carbonai-features" id="features">
                <div className="carbonai-label">CARBONAI PLATFORM</div>
                <h2>Intelligence for a<br /><em>greener business.</em></h2>
                <div className="carbonai-features-grid">
                  {[
                    ['◈', 'Carbon Intelligence', 'Transform complex environmental data into clear insights for your business.'],
                    ['◌', 'Emission Hotspots', 'Quickly discover which activities are responsible for the largest share of emissions.'],
                    ['✦', 'AI Recommendations', 'Receive practical strategies focused on the reductions that matter most.'],
                    ['↗', 'Impact Tracking', 'Track your progress and understand how sustainability decisions change your footprint.'],
                  ].map(([icon, title, description], index) => (
                    <div className="carbonai-feature-card" key={title}>
                      <div className="carbonai-feature-icon">{icon}</div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                      <span className="carbonai-feature-number">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="carbonai-impact" id="impact">
                <div>
                  <div className="carbonai-label">THE CARBONAI DIFFERENCE</div>
                  <h2>Better data.<br /><em>Better decisions.</em></h2>
                </div>
                <div className="carbonai-impact-stat">
                  <strong>28%</strong>
                  <span>average reduction potential</span>
                </div>
              </section>

              <section className="carbonai-about" id="about">
                <div className="carbonai-about-card">
                  <div className="carbonai-label">ABOUT CARBONAI</div>
                  <h2>Technology that helps<br />businesses <em>change.</em></h2>
                  <p>
                    CarbonAI combines carbon accounting, data analysis and artificial intelligence to help organizations make smarter sustainability decisions.
                  </p>
                  <button type="button" className="carbonai-primary" onClick={handleGetStarted}>
                    Start your assessment <span>→</span>
                  </button>
                </div>
              </section>
            </main>
          )}

          {step === 2 && (
            <main className="setup-page">
              <section className="setup-section">
                <div className="setup-card">
                  <div className="badge">✦ CARBONAI SETUP</div>
                  <h1>Let's understand<br />your <span>business.</span></h1>
                  <p className="setup-description">
                    Tell us a little about your company. CarbonAI will use this information to create your personalized carbon assessment.
                  </p>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company name</label>
                      <input type="text" placeholder="e.g. Acme Technologies" value={company.name} onChange={(e) => updateCompany('name', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Industry</label>
                      <select value={company.industry} onChange={(e) => updateCompany('industry', e.target.value)}>
                        <option value="">Select industry</option>
                        <option>Technology</option><option>Manufacturing</option><option>Finance</option>
                        <option>Healthcare</option><option>Retail</option><option>Education</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of employees</label>
                      <input type="number" min="0" placeholder="e.g. 250" value={company.employees} onChange={(e) => updateCompany('employees', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Company location</label>
                      <input type="text" placeholder="e.g. Pune, India" value={company.location} onChange={(e) => updateCompany('location', e.target.value)} />
                    </div>
                  </div>
                  <div className="setup-actions">
                    <button type="button" className="secondary-button" onClick={() => setStep(1)}>← Back</button>
                    <button type="button" className="primary-button" onClick={() => {
                      if (!company.name.trim()) {
                        alert('Please enter your company name.');
                        return;
                      }
                      setStep(3);
                    }}>Continue →</button>
                  </div>
                  <div className="setup-progress"><span className="active" /><span /><span /><small>Step 1 of 3</small></div>
                </div>
              </section>
            </main>
          )}

          {step === 3 && (
            <main className="setup-page">
              <section className="setup-section">
                <div className="setup-card">
                  <div className="badge">✦ STEP 2 · EMISSION DATA</div>
                  <h1>Where do your<br />emissions <span>come from?</span></h1>
                  <p className="setup-description">
                    Enter your company's activity data. CarbonAI will use this information to estimate your carbon footprint.
                  </p>

                  {['⚡ Energy', '⛽ Fuel', '✈️ Business travel', '🚗 Commuting & Waste'].map((category) => (
                    <div className="data-category" key={category}>
                      <div className="category-title">{category}</div>
                      <div className="form-grid">
                        {emissionFields.filter((field) => field.category === category).map((field) => (
                          <div className="form-group" key={field.key}>
                            <label>{field.label}</label>
                            <div className="input-unit">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={field.placeholder}
                                value={emissions[field.key]}
                                onChange={(e) => updateEmissions(field.key, e.target.value)}
                              />
                              <span>{field.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="setup-actions">
                    <button type="button" className="secondary-button" onClick={() => setStep(2)}>← Back</button>
                    <button type="button" className="primary-button" disabled={loading} onClick={handleCalculate}>
                      {loading ? 'Calculating...' : 'Calculate footprint →'}
                    </button>
                  </div>
                  <div className="setup-progress"><span /><span className="active" /><span /><small>Step 2 of 3</small></div>
                </div>
              </section>
            </main>
          )}

          {step === 4 && (
            <main className="setup-page">
              <section className="setup-section">
                <div className="setup-card results-card">
                  <div className="badge">✦ CARBONAI ANALYSIS</div>
                  <h1>Your carbon<br />footprint is <span>ready.</span></h1>
                  <div className="result-number">
                    {totalTco2e.toFixed(4)}
                    <span>tCO₂e / year</span>
                  </div>
                  <p className="setup-description">
                    CarbonAI has analyzed your business activity and identified the areas with the greatest potential for emission reduction.
                  </p>

                  <div className="result-grid">
                    <div className="result-box"><small>ENERGY</small><strong>{energyPct}%</strong><span>of total emissions</span></div>
                    <div className="result-box"><small>TRANSPORT</small><strong>{transportPct}%</strong><span>of total emissions</span></div>
                    <div className="result-box"><small>WASTE</small><strong>{wastePct}%</strong><span>of total emissions</span></div>
                  </div>

                  <div className="ai-card result-ai">
                    <div className="ai-icon">✦</div>
                    <div>
                      <small>CARBONAI RECOMMENDATION</small>
                      <p>
                        {aiRecommendation ||
                          `Your largest emission source is ${largestSource[0] || 'not yet available'}. CarbonAI recommends prioritizing reduction strategies for this category first to maximize your potential impact.`}
                      </p>
                    </div>
                  </div>

                  <div className="setup-actions">
                    <button type="button" className="secondary-button" onClick={() => setStep(3)}>← Edit data</button>
                    <button type="button" className="primary-button" onClick={handleDashboardAccess}>View AI action plan →</button>
                  </div>
                  <div className="setup-progress"><span /><span /><span className="active" /><small>Step 3 of 3</small></div>
                </div>
              </section>
            </main>
          )}
        </>
      )}

      {showSignIn && (
        <div className="signin-overlay" onClick={closeSignIn}>
          <div className="signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="signin-close" onClick={closeSignIn} aria-label="Close sign in" disabled={signInLoading}>×</button>
            <div className="signin-logo">◈</div>
            <div className="badge">✦ WELCOME TO CARBONAI</div>
            <h2 id="signin-title">Sign in to your<br /><span>carbon dashboard.</span></h2>
            <p className="signin-description">Access your carbon insights and continue tracking your organization's environmental impact.</p>
            <form className="signin-form" onSubmit={handleSignIn}>
              <label htmlFor="signin-email">Email address</label>
              <input id="signin-email" type="email" placeholder="you@company.com" autoComplete="email" value={signInEmail} onChange={(event) => setSignInEmail(event.target.value)} disabled={signInLoading} required />
              <label htmlFor="signin-password">Password</label>
              <input id="signin-password" type="password" placeholder="Enter your password" autoComplete="current-password" value={signInPassword} onChange={(event) => setSignInPassword(event.target.value)} disabled={signInLoading} required />
              {signInError && <div className="signin-error" role="alert">{signInError}</div>}
              <button type="submit" className="primary-button signin-submit" disabled={signInLoading}>{signInLoading ? 'Signing in...' : 'Sign in →'}</button>
              <div className="signin-divider"><span>OR</span></div>
              <button type="button" className="google-button" disabled={signInLoading}><span>G</span>Continue with Google</button>
            </form>
            <p className="signup-text">Don't have an account? <span>Create one</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
