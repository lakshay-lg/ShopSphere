import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 200,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<350"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PRODUCT_ID = __ENV.PRODUCT_ID;

if (!PRODUCT_ID) {
  throw new Error("Missing PRODUCT_ID environment variable");
}

export default function () {
  const idempotencyKey = `${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    userId: `user-${Math.floor(Math.random() * 50000)}`,
    productId: PRODUCT_ID,
    quantity: 1
  });

  const response = http.post(`${BASE_URL}/api/flash-sale/order`, payload, {
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    }
  });

  check(response, {
    "status is accepted or replayed": (res) => res.status === 202 || res.status === 200
  });

  sleep(0.05);
}
