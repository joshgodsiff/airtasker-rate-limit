import assert from 'assert';

import {
  SlidingLogRateLimiter
} from './SlidingLog.js';

import { InMemoryStore } from './InMemory.js';

describe("TokenBucket", () => {
  describe("rate limiting strategy", () => {
    it("should not rate limit if this is the first request", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Does not exist";

      const rateLimited = SlidingLogRateLimiter(InMemoryStore(), 10, window)(id);

      assert.strictEqual(rateLimited, false);
    });

    it("should rate limit if the limit is 0", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Does not exist";

      const rateLimited = SlidingLogRateLimiter(InMemoryStore(), 0, window)(id);

      assert.strictEqual(rateLimited, true);
    })

    it("should rate limit once the log exceeds the limit", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Exists";
      const limit = 3;
      const store = InMemoryStore();

      const call1 = SlidingLogRateLimiter(store, limit, window)(id);
      const call2 = SlidingLogRateLimiter(store, limit, window)(id);
      const call3 = SlidingLogRateLimiter(store, limit, window)(id);
      const call4 = SlidingLogRateLimiter(store, limit, window)(id);

      assert.strictEqual(call1, false);
      assert.strictEqual(call2, false);
      assert.strictEqual(call3, false);
      assert.strictEqual(call4, true);
    })

    it("should remove log entries older than the time limit", async () => {
      const window = new Date(0).setUTCSeconds(1);
      const id = "Exists";
      const limit = 3;
      const store = InMemoryStore();

      const call1 = SlidingLogRateLimiter(store, limit, window)(id);
      const call2 = SlidingLogRateLimiter(store, limit, window)(id);
      const call3 = SlidingLogRateLimiter(store, limit, window)(id);
      const call4 = SlidingLogRateLimiter(store, limit, window)(id);

      assert.strictEqual(call1, false);
      assert.strictEqual(call2, false);
      assert.strictEqual(call3, false);
      assert.strictEqual(call4, true);

      await new Promise(r => setTimeout(r, window));

      const call5 = SlidingLogRateLimiter(store, limit, window)(id);
      assert.strictEqual(call5, false);
    })
  })
})