import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getJokeDuration = new Trend('get_joke_duration', true);
export const rateStatusCode = new Rate('status_code_success');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.25'],
    get_joke_duration: ['p(90)<6800'],
    status_code_success: ['rate>0.75']
  },
  stages: [
    { duration: '30s', target: 7 },
    { duration: '120s', target: 92 },
    { duration: '60s', target: 92 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://v2.jokeapi.dev/joke/Any';

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
    }
  };

  const res = http.get(baseUrl, params);

  getJokeDuration.add(res.timings.duration);

  rateStatusCode.add(res.status === 200);

  check(res, {
    'GET Joke - Status 200': () => res.status === 200,
    'GET Joke - Response time < 6800ms': () => res.timings.duration < 6800,
    'GET Joke - Has response body': () => res.body.length > 0
  });
}