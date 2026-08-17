import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import exec from "k6/execution";

const BASE = __ENV.STAGING_URL;
const BaselineDur = new Trend("dur_baseline", true);
const durPeak = new Trend("dur_peak", true);

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-vus",
      vus: 40,
      duration: "3m",
      startTime: "0s",
      exec: "feed",
    },
    peak: {
      executor: "constant-vus",
      vus: 80,
      duration: "3m",
      startTime: "3m30s",
      exec: "feed",
    },
  },

  thresholds: {
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
  if (res.status !== 200) console.log(`${res.status} ${res.request.url}`);
  (exec.scenario.name === "baseline" ? BaselineDur : durPeak).add(
    res.timings.duration,
  );
  sleep(1);
}

export function handleSummary(data) {
  const basePeak = data.metrics.dur_baseline.values["p(95)"];
  const peakOfPeak = data.metrics.dur_peak.values["p(95)"];
  const ok = peakOfPeak <= basePeak * 1.5;

  const cleanedUp = { ...data, setup_data: { redacted: true } };
  return {
    "scale-summary.json": JSON.stringify(cleanedUp, null, 2),
    stdout: `baseline p95=${basePeak}ms peak p95=${peakOfPeak}ms ${ok ? "OK" : "FAILED"}`,
  };
}
