import axios from 'axios';

const API_BASE_URL = 'https://carbonai-backend.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Submit Assessment Data (Scope 1, 2, & 3 Inputs)
export const submitAssessment = async (assessmentData) => {
  try {
    const response = await api.post('/assessment', assessmentData);
    return response.data;
  } catch (error) {
    console.error('Error submitting assessment:', error);
    throw error;
  }
};

// 2. Fetch Calculated Results for Dashboard.jsx
export const getDashboardResults = async () => {
  try {
    const response = await api.get('/results');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard results:', error);
    throw error;
  }
};

// 3. Post Scenario Adjustments for WhatIfSimulator.jsx
export const runWhatIfSimulation = async (scenarioData) => {
  try {
    const response = await api.post('/what-if', scenarioData);
    return response.data;
  } catch (error) {
    console.error('Error running What-If simulation:', error);
    throw error;
  }
};

// 4. Fetch AI Action Plan Recommendations for ActionPlanCard.jsx
export const getActionPlan = async () => {
  try {
    const response = await api.get('/action-plan');
    return response.data;
  } catch (error) {
    console.error('Error fetching action plan:', error);
    throw error;
  }
};
const apiExport = { api, getDashboardResults, runWhatIfSimulation, getActionPlan };
export default apiExport;