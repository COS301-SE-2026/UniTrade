import http from "k6/http";
import { check, sleep } from "k6";
const BASE = __ENV.STAGING_URL;
export const options = {
  scenarios: {
    feed: { executor: "constant-vus", vus: 17, duration: "3m", exec: "feed" },
    browse: {
      executor: "constant-vus",
      vus: 17,
      duration: "3m",
      exec: "browse",
    },

    search: {
      executor: "constant-vus",
      vus: 16,
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
  return { authCookie: cookies ? cookies[0].value : null };
}

export function feed(data) {
  const res = http.get(`${BASE}/api/listings`, {
    cookies: { authToken: data.authCookie },
  });
  check(res, { 200: (r) => r.status === 200 });
  sleep(1);
}

export function browse(data) {
  const res = http.get(
    `${BASE}/api/listings?CategoryId=e2017858-d319-49fa-bea4-c407ea9921e4`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
  check(res, { 200: (r) => r.status === 200 });
  sleep(1);
}

export function search(data) {
  const res = http.get(`${BASE}/api/listings?Search=calculus`, {
    cookies: { authToken: data.authCookie },
  });
  check(res, { 200: (r) => r.status === 200 });
  sleep(1);
}
