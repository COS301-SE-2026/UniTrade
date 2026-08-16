import http from "k6/http";
import { check, sleep } from "k6";
const BASE = __ENV.STAGING_URL;
export const options = {
  scenarios: {
    feed: { executor: "constant-vus", vus: 5, duration: "3m", exec: "feed" },
    browse: {
      executor: "constant-vus",
      vus: 3,
      duration: "3m",
      exec: "browse",
    },

    search: {
      executor: "constant-vus",
      vus: 2,
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
  const res = http.get(
    `${BASE}/api/listings?listingStatus=live&excludeSellerId=01a00656-30f7-791d-82a7-d592718af946`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
  check(res, { 200: (r) => r.status === 200 });
  //if (res.status !== 200) console.log(`${res.status} ${res.request.url}`);
  sleep(1);
}

export function browse(data) {
  const res = http.get(
    `${BASE}/api/listings/e2017858-d319-49fa-bea4-c407ea9921e4`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
  check(res, { 200: (r) => r.status === 200 });
  //if (res.status !== 200) console.log(`${res.status} ${res.request.url}`);

  sleep(1);
}

export function search(data) {
  const res = http.get(
    `${BASE}/api/listings?listingStatus=live&excludeSellerId=01a00656-30f7-791d-82a7-d592718af946&search=calculus`,
    {
      cookies: { authToken: data.authCookie },
    },
  );
  check(res, { 200: (r) => r.status === 200 });
  //if (res.status !== 200) console.log(`${res.status} ${res.request.url}`);

  sleep(1);
}
