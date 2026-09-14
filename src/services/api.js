const BASE_URL = 'https://carbonai-backend.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const signup = async (userData) => {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Signup failed');
  return res.json();
};

export const signin = async (credentials) => {
  const res = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error('Signin failed');
  return res.json();
};

export const submitAssessment = async (assessmentInput) => {
  const res = await fetch(`${BASE_URL}/api/recommendations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assessmentInput),
  });
  if (!res.ok) throw new Error('Failed to submit assessment');
  return res.json();
};

const api = {
  signup,
  signin,
  submitAssessment,
};

export default api;
export { api };