// ============================
// GLOBAL STATE & CONSTANTS
// ============================
const API_URL = 'http://127.0.0.1:5000/api';
let authToken = null;
let currentUser = null;
let expenses = [];

// Chart instances
let categoryChart = null;
let trendChart = null;
let plannerChart = null;

// Baseline data for planner
let baselineTotal = 0;
let baselineForecast = 0;
let baselineScore = 0;
let baselineBuckets = { rent: 0, groc: 0, elect: 0, trans: 0, other: 0 };
