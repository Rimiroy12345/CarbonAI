import React, { useState } from 'react';

import {
  submitAssessment,
  signIn,
  signOut,
} from './services/api';

import Dashboard from './pages/Dashboard';
import carbonAIImage from './assets/carbon-ai.png';
import './App.css';

export default function App() {
  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('access_token'))
  );

  const [showSignIn, setShowSignIn] = useState(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  // =========================================================
  // APP STATE
  // =========================================================

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

  // =========================================================
  // UPDATE COMPANY DATA
  // =========================================================

  const updateCompany = (field, value) => {
    setCompany((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // UPDATE EMISSION DATA
  // =========================================================

  const updateEmissions = (field, value) => {
    setEmissions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // LANDING PAGE SCROLL
  // =========================================================

  const goToLandingSection = (sectionId) => {
    setStep(1);

    setTimeout(() => {
      const element = document.getElementById(sectionId);

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  // =========================================================
  // OPEN SIGN IN
  // =========================================================

  const openSignIn = () => {
    setSignInError('');
    setSignInEmail('');
    setSignInPassword('');
    setShowSignIn(true);
  };

  // =========================================================
  // CLOSE SIGN IN
  // =========================================================

  const closeSignIn = () => {
    if (signInLoading) {
      return;
    }

    setShowSignIn(false);
    setSignInError('');
  };

  // =========================================================
  // GET STARTED
  // =========================================================

  const handleGetStarted = () => {
    console.log('GET STARTED CLICKED');

    if (!isLoggedIn) {
      console.log('USER NOT LOGGED IN - OPENING SIGN IN');
      openSignIn();
      return;
    }

    console.log('USER ALREADY LOGGED IN - OPENING BUSINESS SETUP');

    setActiveTab('landing');
    setStep(2);
  };

  // =========================================================
  // SIGN IN
  // =========================================================

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
      console.log('Attempting sign in...');

      const response = await signIn(email, password);

      console.log('Sign in successful:', response);

      // Login is successful
      setIsLoggedIn(true);

      // Close sign-in modal
      setShowSignIn(false);

      // Clear login fields
      setSignInEmail('');
      setSignInPassword('');
      setSignInError('');

      // Send user to business setup
      setActiveTab('landing');
      setStep(2);
    } catch (error) {
      console.error('Sign in error:', error);

      setSignInError(
        error?.message ||
          'Sign in failed. Please check your email and password.'
      );
    } finally {
      setSignInLoading(false);
    }
  };

  // =========================================================
  // DASHBOARD ACCESS
  // =========================================================

  const handleDashboardAccess = () => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }

    setActiveTab('dashboard');
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    signOut();

    setIsLoggedIn(false);
    setActiveTab('landing');
    setStep(1);

    setCompany({
      name: '',
      industry: '',
      employees: '',
      location: '',
    });

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

    console.log('User logged out');
  };

  // =========================================================
  // CARBON CALCULATIONS
  // =========================================================

  const electricityEmissions =
    (parseFloat(emissions.electricity) || 0) * 0.00085;

  const gasEmissions =
    (parseFloat(emissions.naturalGas) || 0) * 0.00202;

  const petrolEmissions =
    (parseFloat(emissions.petrol) || 0) * 0.00231;

  const dieselEmissions =
    (parseFloat(emissions.diesel) || 0) * 0.00268;

  const flightEmissions =
    (parseFloat(emissions.flights) || 0) * 0.00015;

  const hotelEmissions =
    (parseFloat(emissions.hotels) || 0) * 0.03;

  const commuteEmissions =
    (parseFloat(emissions.commuting) || 0) * 0.00012;

  const wasteEmissions =
    (parseFloat(emissions.waste) || 0) * 0.0005;

  const energyEmissions =
    electricityEmissions + gasEmissions;

  const transportEmissions =
    petrolEmissions +
    dieselEmissions +
    flightEmissions +
    hotelEmissions +
    commuteEmissions;

  const totalEmissions =
    energyEmissions +
    transportEmissions +
    wasteEmissions;

  const percentage = (value) => {
    if (!totalEmissions || totalEmissions === 0) {
      return 0;
    }

    return Math.round(
      (value / totalEmissions) * 100
    );
  };

  const emissionBreakdown = {
    Energy: energyEmissions,
    Transport: transportEmissions,
    Waste: wasteEmissions,
  };

  const largestSource = Object.entries(
    emissionBreakdown
  ).reduce(
    (max, item) =>
      item[1] > max[1] ? item : max,
    ['Energy', 0]
  );

  // =========================================================
  // SUBMIT ASSESSMENT
  // =========================================================

  const handleCalculate = async () => {
    // Extra authentication protection
    if (!isLoggedIn) {
      openSignIn();
      return;
    }

    setLoading(true);

    const payload = {
      company,
      emissions,
    };

    try {
      console.log('Submitting assessment...');

      const response = await submitAssessment(payload);

      console.log(
        'Assessment response:',
        response
      );

      if (
        response &&
        (
          response.recommendation ||
          response.aiRecommendation
        )
      ) {
        setAiRecommendation(
          response.recommendation ||
            response.aiRecommendation
        );
      }

      setStep(4);
    } catch (error) {
      console.error(
        'Calculation failed:',
        error
      );

      // Keep existing fallback behaviour
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="carbonai-navbar">

        <button
          type="button"
          className="carbonai-logo"
          onClick={() => {
            setActiveTab('landing');
            goToLandingSection('home');
          }}
        >
          <span className="logo-mark">
            ◈
          </span>

          Carbon<span>AI</span>
        </button>

        <div className="carbonai-nav-links">

          <button
            type="button"
            onClick={() => {
              setActiveTab('landing');
              goToLandingSection('how');
            }}
          >
            How it works
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('landing');
              goToLandingSection('features');
            }}
          >
            Features
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('landing');
              goToLandingSection('impact');
            }}
          >
            Impact
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('landing');
              goToLandingSection('about');
            }}
          >
            About
          </button>

          {/* DASHBOARD */}

          <button
            type="button"
            onClick={handleDashboardAccess}
            className={`carbonai-nav-link ${
              activeTab === 'dashboard'
                ? 'active'
                : ''
            }`}
          >
            Dashboard
          </button>

          {/* SIGN IN / SIGN OUT */}

          {!isLoggedIn ? (

            <button
              type="button"
              className="carbonai-signin"
              onClick={openSignIn}
            >
              Sign in <span>→</span>
            </button>

          ) : (

            <button
              type="button"
              className="carbonai-signin"
              onClick={handleLogout}
            >
              Sign out <span>→</span>
            </button>

          )}

        </div>
      </nav>

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      {activeTab === 'dashboard' ? (

        <Dashboard
          company={company}
          emissions={emissions}
          aiRecommendation={aiRecommendation}
          onLogout={handleLogout}
        />

      ) : (

        <>

          {/* =================================================
              STEP 1 — LANDING PAGE
          ================================================= */}

          {step === 1 && (

            <main className="carbonai-landing">

              {/* HERO */}

              <section
                className="carbonai-hero"
                id="home"
              >

                <div className="carbonai-hero-glow" />

                <div className="carbonai-hero-text">

                  <div className="carbonai-eyebrow">
                    A CLEANER TOMORROW, POWERED BY AI
                  </div>

                  <h1>
                    Measure today.
                    <br />
                    <em>A greener</em>
                    <br />
                    tomorrow.
                  </h1>

                  <p>
                    CarbonAI helps businesses understand
                    their carbon footprint, identify emission
                    hotspots, and discover smarter AI-driven
                    ways to reduce their environmental impact.
                  </p>

                  <div className="carbonai-hero-buttons">

                    <button
                      type="button"
                      className="carbonai-primary"
                      onClick={handleGetStarted}
                    >
                      Get started <span>→</span>
                    </button>

                  </div>

                  <div className="carbonai-stats">

                    <div>
                      <strong>500+</strong>
                      <span>
                        Businesses onboarded
                      </span>
                    </div>

                    <div>
                      <strong>2.8M</strong>
                      <span>
                        tCO₂e analysed
                      </span>
                    </div>

                    <div>
                      <strong>28%</strong>
                      <span>
                        Average reduction potential
                      </span>
                    </div>

                  </div>

                </div>

                <div className="carbonai-visual">

                  <div className="carbonai-image-glow" />

                  <div className="carbonai-image-wrap">

                    <img
                      src={carbonAIImage}
                      alt="CarbonAI sustainable future"
                      className="carbonai-image"
                    />

                  </div>

                </div>

              </section>

              {/* TRUST */}

              <section className="carbonai-trust">

                <p>
                  TRUSTED BY FORWARD-THINKING COMPANIES
                </p>

                <div className="carbonai-trust-logos">

                  <span>Google</span>
                  <span>Microsoft</span>
                  <span>TATA</span>
                  <span>Infosys</span>
                  <span>Reliance</span>

                </div>

              </section>

              {/* HOW IT WORKS */}

              <section
                className="carbonai-how"
                id="how"
              >

                <div className="carbonai-label">
                  HOW IT WORKS
                </div>

                <h2>
                  From data to <em>real impact.</em>
                </h2>

                <p className="carbonai-description">
                  A simple process. A significant difference.
                  Turn your business data into a cleaner,
                  greener future.
                </p>

                <div className="carbonai-process">

                  <div className="carbonai-process-card">

                    <span className="carbonai-process-number">
                      01
                    </span>

                    <div className="carbonai-process-icon">
                      ◫
                    </div>

                    <h3>
                      Measure
                    </h3>

                    <p>
                      Input your business activity data
                      across key emission sources.
                    </p>

                  </div>

                  <div className="carbonai-process-arrow">
                    →
                  </div>

                  <div className="carbonai-process-card">

                    <span className="carbonai-process-number">
                      02
                    </span>

                    <div className="carbonai-process-icon">
                      ◌
                    </div>

                    <h3>
                      Understand
                    </h3>

                    <p>
                      Identify your biggest emission
                      hotspots with AI-powered analysis.
                    </p>

                  </div>

                  <div className="carbonai-process-arrow">
                    →
                  </div>

                  <div className="carbonai-process-card">

                    <span className="carbonai-process-number">
                      03
                    </span>

                    <div className="carbonai-process-icon">
                      ◇
                    </div>

                    <h3>
                      Take action
                    </h3>

                    <p>
                      Get tailored recommendations to
                      reduce your carbon footprint.
                    </p>

                  </div>

                </div>

              </section>

              {/* FEATURES */}

              <section
                className="carbonai-features"
                id="features"
              >

                <div className="carbonai-label">
                  CARBONAI PLATFORM
                </div>

                <h2>
                  Intelligence for a
                  <br />
                  <em>greener business.</em>
                </h2>

                <div className="carbonai-features-grid">

                  <div className="carbonai-feature-card">

                    <div className="carbonai-feature-icon">
                      ◈
                    </div>

                    <h3>
                      Carbon Intelligence
                    </h3>

                    <p>
                      Transform complex environmental
                      data into clear insights for your
                      business.
                    </p>

                    <span className="carbonai-feature-number">
                      01
                    </span>

                  </div>

                  <div className="carbonai-feature-card">

                    <div className="carbonai-feature-icon">
                      ◌
                    </div>

                    <h3>
                      Emission Hotspots
                    </h3>

                    <p>
                      Quickly discover which activities
                      are responsible for the largest
                      share of emissions.
                    </p>

                    <span className="carbonai-feature-number">
                      02
                    </span>

                  </div>

                  <div className="carbonai-feature-card">

                    <div className="carbonai-feature-icon">
                      ✦
                    </div>

                    <h3>
                      AI Recommendations
                    </h3>

                    <p>
                      Receive practical strategies focused
                      on the reductions that matter most.
                    </p>

                    <span className="carbonai-feature-number">
                      03
                    </span>

                  </div>

                  <div className="carbonai-feature-card">

                    <div className="carbonai-feature-icon">
                      ↗
                    </div>

                    <h3>
                      Impact Tracking
                    </h3>

                    <p>
                      Track your progress and understand
                      how sustainability decisions change
                      your footprint.
                    </p>

                    <span className="carbonai-feature-number">
                      04
                    </span>

                  </div>

                </div>

              </section>

              {/* IMPACT */}

              <section
                className="carbonai-impact"
                id="impact"
              >

                <div>

                  <div className="carbonai-label">
                    THE CARBONAI DIFFERENCE
                  </div>

                  <h2>
                    Better data.
                    <br />
                    <em>Better decisions.</em>
                  </h2>

                </div>

                <div className="carbonai-impact-stat">

                  <strong>
                    28%
                  </strong>

                  <span>
                    average reduction potential
                  </span>

                </div>

              </section>

              {/* ABOUT */}

              <section
                className="carbonai-about"
                id="about"
              >

                <div className="carbonai-about-card">

                  <div className="carbonai-label">
                    ABOUT CARBONAI
                  </div>

                  <h2>
                    Technology that helps
                    <br />
                    businesses <em>change.</em>
                  </h2>

                  <p>
                    CarbonAI combines carbon accounting,
                    data analysis and artificial intelligence
                    to help organizations make smarter
                    sustainability decisions.
                  </p>

                  <button
                    type="button"
                    className="carbonai-primary"
                    onClick={handleGetStarted}
                  >
                    Start your assessment <span>→</span>
                  </button>

                </div>

              </section>

            </main>
          )}

          {/* =================================================
              STEP 2 — BUSINESS SETUP
          ================================================= */}

          {step === 2 && (

            <main className="setup-page">

              <section className="setup-section">

                <div className="setup-card">

                  <div className="badge">
                    ✦ CARBONAI SETUP
                  </div>

                  <h1>
                    Let's understand
                    <br />
                    your <span>business.</span>
                  </h1>

                  <p className="setup-description">
                    Tell us a little about your company.
                    CarbonAI will use this information to
                    create your personalized carbon assessment.
                  </p>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Company name
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Acme Technologies"
                        value={company.name}
                        onChange={(e) =>
                          updateCompany(
                            'name',
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Industry
                      </label>

                      <select
                        value={company.industry}
                        onChange={(e) =>
                          updateCompany(
                            'industry',
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select industry
                        </option>

                        <option>
                          Technology
                        </option>

                        <option>
                          Manufacturing
                        </option>

                        <option>
                          Finance
                        </option>

                        <option>
                          Healthcare
                        </option>

                        <option>
                          Retail
                        </option>

                        <option>
                          Education
                        </option>

                        <option>
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        Number of employees
                      </label>

                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={company.employees}
                        onChange={(e) =>
                          updateCompany(
                            'employees',
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Company location
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Pune, India"
                        value={company.location}
                        onChange={(e) =>
                          updateCompany(
                            'location',
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  <div className="setup-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setStep(1)}
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setStep(3)}
                    >
                      Continue →
                    </button>

                  </div>

                  <div className="setup-progress">

                    <span className="active" />
                    <span />
                    <span />

                    <small>
                      Step 1 of 3
                    </small>

                  </div>

                </div>

              </section>

            </main>
          )}

          {/* =================================================
              STEP 3 — EMISSION DATA
          ================================================= */}

          {step === 3 && (

            <main className="setup-page">

              <section className="setup-section">

                <div className="setup-card">

                  <div className="badge">
                    ✦ STEP 2 · EMISSION DATA
                  </div>

                  <h1>
                    Where do your
                    <br />
                    emissions <span>come from?</span>
                  </h1>

                  <p className="setup-description">
                    Enter your company's activity data.
                    CarbonAI will use this information to
                    estimate your carbon footprint.
                  </p>

                  {/* ENERGY */}

                  <div className="data-category">

                    <div className="category-title">
                      ⚡ Energy
                    </div>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>
                          Electricity consumption
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={emissions.electricity}
                            onChange={(e) =>
                              updateEmissions(
                                'electricity',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            kWh / year
                          </span>

                        </div>

                      </div>

                      <div className="form-group">

                        <label>
                          Natural gas
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={emissions.naturalGas}
                            onChange={(e) =>
                              updateEmissions(
                                'naturalGas',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            m³ / year
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* FUEL */}

                  <div className="data-category">

                    <div className="category-title">
                      ⛽ Fuel
                    </div>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>
                          Petrol
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 2500"
                            value={emissions.petrol}
                            onChange={(e) =>
                              updateEmissions(
                                'petrol',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            litres / year
                          </span>

                        </div>

                      </div>

                      <div className="form-group">

                        <label>
                          Diesel
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 3000"
                            value={emissions.diesel}
                            onChange={(e) =>
                              updateEmissions(
                                'diesel',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            litres / year
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* BUSINESS TRAVEL */}

                  <div className="data-category">

                    <div className="category-title">
                      ✈️ Business travel
                    </div>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>
                          Air travel
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 50000"
                            value={emissions.flights}
                            onChange={(e) =>
                              updateEmissions(
                                'flights',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            km / year
                          </span>

                        </div>

                      </div>

                      <div className="form-group">

                        <label>
                          Hotel stays
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={emissions.hotels}
                            onChange={(e) =>
                              updateEmissions(
                                'hotels',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            nights / year
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* COMMUTING & WASTE */}

                  <div className="data-category">

                    <div className="category-title">
                      🚗 Commuting & Waste
                    </div>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>
                          Employee commuting
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 120000"
                            value={emissions.commuting}
                            onChange={(e) =>
                              updateEmissions(
                                'commuting',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            km / year
                          </span>

                        </div>

                      </div>

                      <div className="form-group">

                        <label>
                          Waste generated
                        </label>

                        <div className="input-unit">

                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={emissions.waste}
                            onChange={(e) =>
                              updateEmissions(
                                'waste',
                                e.target.value
                              )
                            }
                          />

                          <span>
                            kg / year
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="setup-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setStep(2)}
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={loading}
                      onClick={handleCalculate}
                    >
                      {loading
                        ? 'Analyzing with AI...'
                        : 'Calculate footprint →'}
                    </button>

                  </div>

                  <div className="setup-progress">

                    <span />
                    <span className="active" />
                    <span />

                    <small>
                      Step 2 of 3
                    </small>

                  </div>

                </div>

              </section>

            </main>
          )}

          {/* =================================================
              STEP 4 — RESULTS
          ================================================= */}

          {step === 4 && (

            <main className="setup-page">

              <section className="setup-section">

                <div className="setup-card results-card">

                  <div className="badge">
                    ✦ CARBONAI ANALYSIS
                  </div>

                  <h1>
                    Your carbon
                    <br />
                    footprint is <span>ready.</span>
                  </h1>

                  <div className="result-number">

                    {totalEmissions.toFixed(2)}

                    <span>
                      tCO₂e / year
                    </span>

                  </div>

                  <p className="setup-description">
                    CarbonAI has analyzed your business
                    activity and identified the areas with
                    the greatest potential for emission
                    reduction.
                  </p>

                  <div className="result-grid">

                    <div className="result-box">

                      <small>
                        ENERGY
                      </small>

                      <strong>
                        {percentage(
                          energyEmissions
                        )}
                        %
                      </strong>

                      <span>
                        of total emissions
                      </span>

                    </div>

                    <div className="result-box">

                      <small>
                        TRANSPORT
                      </small>

                      <strong>
                        {percentage(
                          transportEmissions
                        )}
                        %
                      </strong>

                      <span>
                        of total emissions
                      </span>

                    </div>

                    <div className="result-box">

                      <small>
                        WASTE
                      </small>

                      <strong>
                        {percentage(
                          wasteEmissions
                        )}
                        %
                      </strong>

                      <span>
                        of total emissions
                      </span>

                    </div>

                  </div>

                  <div className="ai-card result-ai">

                    <div className="ai-icon">
                      ✦
                    </div>

                    <div>

                      <small>
                        CARBONAI RECOMMENDATION
                      </small>

                      <p>

                        {aiRecommendation
                          ? aiRecommendation
                          : `Your largest emission source is ${
                              largestSource[0] ||
                              'not yet available'
                            }. CarbonAI recommends prioritizing reduction strategies for this category first to maximize your potential impact.`}

                      </p>

                    </div>

                  </div>

                  <div className="setup-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setStep(3)}
                    >
                      ← Edit data
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleDashboardAccess}
                    >
                      View AI action plan →
                    </button>

                  </div>

                  <div className="setup-progress">

                    <span />
                    <span />
                    <span className="active" />

                    <small>
                      Step 3 of 3
                    </small>

                  </div>

                </div>

              </section>

            </main>
          )}

        </>

      )}

      {/* =====================================================
          SIGN IN MODAL
      ===================================================== */}

      {showSignIn && (

        <div
          className="signin-overlay"
          onClick={closeSignIn}
        >

          <div
            className="signin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="signin-close"
              onClick={closeSignIn}
              aria-label="Close sign in"
              disabled={signInLoading}
            >
              ×
            </button>

            {/* LOGO */}

            <div className="signin-logo">
              ◈
            </div>

            <div className="badge">
              ✦ WELCOME TO CARBONAI
            </div>

            <h2 id="signin-title">

              Sign in to your
              <br />

              <span>
                carbon dashboard.
              </span>

            </h2>

            <p className="signin-description">
              Access your carbon insights and continue
              tracking your organization's environmental
              impact.
            </p>

            {/* FORM */}

            <form
              className="signin-form"
              onSubmit={handleSignIn}
            >

              {/* EMAIL */}

              <label htmlFor="signin-email">
                Email address
              </label>

              <input
                id="signin-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={signInEmail}
                onChange={(event) =>
                  setSignInEmail(
                    event.target.value
                  )
                }
                disabled={signInLoading}
                required
              />

              {/* PASSWORD */}

              <label htmlFor="signin-password">
                Password
              </label>

              <input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={signInPassword}
                onChange={(event) =>
                  setSignInPassword(
                    event.target.value
                  )
                }
                disabled={signInLoading}
                required
              />

              {/* ERROR */}

              {signInError && (

                <div
                  className="signin-error"
                  role="alert"
                >
                  {signInError}
                </div>

              )}

              {/* SIGN IN */}

              <button
                type="submit"
                className="primary-button signin-submit"
                disabled={signInLoading}
              >
                {signInLoading
                  ? 'Signing in...'
                  : 'Sign in →'}
              </button>

              {/* DIVIDER */}

              <div className="signin-divider">
                <span>
                  OR
                </span>
              </div>

              {/* GOOGLE */}

              <button
                type="button"
                className="google-button"
                disabled={signInLoading}
              >
                <span>
                  G
                </span>

                Continue with Google
              </button>

            </form>

            {/* SIGN UP */}

            <p className="signup-text">
              Don't have an account?{' '}
              <span>
                Create one
              </span>
            </p>

          </div>

        </div>

      )}

    </div>
  );
}