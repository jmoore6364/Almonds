import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate should be below 1%
    'errors': ['rate<0.1'],             // Custom error rate below 10%
  },
};

// Base URL
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test data
let authToken = null;

export function setup() {
  // Register and login to get auth token
  const registerPayload = JSON.stringify({
    email: `loadtest-${Date.now()}@example.com`,
    name: 'Load Test User',
    password: 'loadtest123',
  });

  const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status === 201) {
    const token = registerRes.json('access_token');
    return { token };
  }

  return { token: null };
}

export default function (data) {
  // Test 1: Health Check
  testHealthCheck();
  sleep(1);

  // Test 2: Authentication (if we have a token)
  if (data.token) {
    testAuthenticatedEndpoints(data.token);
    sleep(1);
  }

  // Test 3: Public endpoints
  testPublicEndpoints();
  sleep(1);
}

function testHealthCheck() {
  const res = http.get(`${BASE_URL}/api/v1/health/live`);

  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time OK': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);
}

function testAuthenticatedEndpoints(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Get profile
  const profileRes = http.get(`${BASE_URL}/api/v1/auth/profile`, { headers });
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => r.json('email') !== undefined,
  }) || errorRate.add(1);

  // Get organizations
  const orgsRes = http.get(`${BASE_URL}/api/v1/organizations`, { headers });
  check(orgsRes, {
    'organizations status is 200': (r) => r.status === 200,
    'organizations is array': (r) => Array.isArray(r.json()),
  }) || errorRate.add(1);
}

function testPublicEndpoints() {
  // API documentation
  const docsRes = http.get(`${BASE_URL}/api/docs`);
  check(docsRes, {
    'docs status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}
