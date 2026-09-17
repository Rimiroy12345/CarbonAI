import axios from 'axios';

const API_BASE_URL = 'https://carbonai-backend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Supabase access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// AUTH - SIGN IN
// --------------------------------------------------
export const signIn = async (email, password) => {
  try {
    const response = await api.post('/auth/signin', { email, password });
    const data = response.data;
    const accessToken = data?.session?.access_token;

    if (!accessToken) {
      throw new Error('Login succeeded but no access token was returned by the backend.');
    }

    localStorage.setItem('access_token', accessToken);
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Sign in failed:', error);
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Invalid email or password. Please try again.';
    throw new Error(message);
  }
};

// --------------------------------------------------
// AUTH - SIGN UP
// --------------------------------------------------
export const signUp = async (email, password) => {
  try {
    const response = await api.post('/auth/signup', { email, password });
    const data = response.data;

    if (data?.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
    }

    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Sign up failed:', error);
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Unable to create account. Please try again.';
    throw new Error(message);
  }
};

// --------------------------------------------------
// AUTH - SIGN OUT
// --------------------------------------------------
export const signOut = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

// --------------------------------------------------
// AUTH - CHECK LOGIN
// --------------------------------------------------
export const isAuthenticated = () => Boolean(localStorage.getItem('access_token'));

// --------------------------------------------------
// ASSESSMENT
// --------------------------------------------------
export const submitAssessment = async (assessmentData) => {
  const companyName = String(assessmentData?.company_name || '').trim();
  if (!companyName) {
    throw new Error('Please enter your company name before calculating your footprint.');
  }

  const numericFields = [
    'electricity',
    'natural_gas',
    'petrol',
    'diesel',
    'air_travel',
    'hotels',
    'commuting',
    'waste',
  ];

  for (const field of numericFields) {
    const value = Number(assessmentData?.[field] ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Emission values must be valid numbers greater than or equal to zero.');
    }
  }

  const totalActivity = numericFields.reduce(
    (sum, field) => sum + Number(assessmentData?.[field] ?? 0),
    0
  );

  if (totalActivity <= 0) {
    throw new Error('Please enter at least one non-zero emission value before calculating your footprint.');
  }

  const employeeCount = assessmentData?.employee_count;
  if (employeeCount !== null && employeeCount !== undefined) {
    if (!Number.isInteger(employeeCount) || employeeCount < 1) {
      throw new Error('Employee count must be a whole number greater than zero.');
    }
  }

  try {
    const response = await api.post('/assessment', {
      ...assessmentData,
      company_name: companyName,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting assessment:', error);
    throw error;
  }
};

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------
export const getDashboardResults = async () => {
  try {
    const response = await api.get('/results');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard results:', error);
    throw error;
  }
};

// --------------------------------------------------
// WHAT-IF SIMULATOR
// --------------------------------------------------
export const runWhatIfSimulation = async (scenarioData) => {
  try {
    const response = await api.post('/what-if', scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error running What-If simulation:', error);
    throw error;
  }
};

// --------------------------------------------------
// AI ACTION PLAN
// --------------------------------------------------
export const getActionPlan = async () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) throw new Error('No access token found. Please log in again.');

    const response = await api.get('/action-plan', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching action plan:', error);
    throw error;
  }
};

const apiExport = {
  api,
  signIn,
  signUp,
  signOut,
  isAuthenticated,
  submitAssessment,
  getDashboardResults,
  runWhatIfSimulation,
  getActionPlan,
};

export default apiExport;
