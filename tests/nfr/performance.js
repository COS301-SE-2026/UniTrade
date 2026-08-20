import http from "k6/http";
import { check, randomSeed, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { Counter } from "k6/metrics";


const BASE = __ENV.STAGING_URL;
const statusCounts = new Counter("status_codes");

export const options = {
  scenarios: {
    feed: {
      executor: "constant-vus",
      vus: 5 * 4,
      duration: "3m",
      exec: "feed",
    },
    browse: {
      executor: "constant-vus",
      vus: 3 * 4,
      duration: "3m",
      exec: "browse",
    },

    search: {
      executor: "constant-vus",
      vus: 2 * 4,
      duration: "3m",
      exec: "search",
    },
  },

  thresholds: {
    "http_req_duration{scenario:feed}": ["p(95)<800"],
    "http_req_duration{scenario:browse}": ["p(95)<800"],
    "http_req_duration{scenario:search}": ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({
      email: __ENV.K6_TEST_USER_EMAIL,
      password: __ENV.K6_TEST_USER_PASSWORD,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, { "login succeeded": (x) => x.status === 200 });
  const cookies = res.cookies["authToken"];
  return {
    authCookie: cookies ? cookies[0].value : null,
    loginTime: Date.now(),
  };
}

function record(res, scenario) {
  statusCounts.add(1, { scenario, status: res.status.toString() });
  check(res, { 200: (r) => r.status === 200 });
}
export function feed(data) {
  const res = http.get(
    `${BASE}/api/listings?listingStatus=live&excludeSellerId=01a00656-30f7-791d-82a7-d592718af946`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
  if(res.status!==200){
    console.log(`[${"feed"}] status=${res.status} body=${res.body?.slice(0,200)}`);
  }
  check(res, { 200: (r) => r.status === 200 });
  record(res, "feed");

  sleep(1);
}

export function browse(data) {
  const res = http.get(
    `${BASE}/api/listings/e2017858-d319-49fa-bea4-c407ea9921e4`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
    if(res.status!==200){
    console.log(`[${"browse"}] status=${res.status} body=${res.body?.slice(0,200)}`);
  }
  check(res, { 200: (r) => r.status === 200 });
  record(res, "browse");

  sleep(1);
}

export function search(data) {
  const res = http.get(
    `${BASE}/api/listings?listingStatus=live&excludeSellerId=01a00656-30f7-791d-82a7-d592718af946&search=calculus`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
    if(res.status!==200){
    console.log(`[${"search"}] status=${res.status} body=${res.body?.slice(0,200)}`);
  }
  check(res, { 200: (r) => r.status === 200 });
  record(res, "search");

  sleep(1);
}
export function handleSummary(data) {
  const cleanedUp = { ...data, setup_data: { redacted: true } };
  return {
    "perf-summary.json": JSON.stringify(cleanedUp, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: false }),
  };
}
