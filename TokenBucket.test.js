import { 
  TokenBucketRateLimiter, 
  _tokensAvailable, 
  _value
} from './TokenBucket.js';

import { InMemoryStore } from './InMemory.js';

import assert from 'assert';

describe("TokenBucket", () => {
  describe("Calculating available tokens", () => {
    it("should return the maximum limit if we haven't used any tokens, regardless of timestamp", () => {
      const date = new Date(0);
      const limit = 10;
      const bucketValue = _value({timestamp: date, tokens: limit});
      const tokens = _tokensAvailable({time: date, limit, window: date.getTime(), currentValue: bucketValue});

      assert.strictEqual(tokens, limit)
    }),

    it("should return no tokens available, if we start with no tokens and time has not moved", () => {
      const date = new Date(0);
      const limit = 10;
      const bucketValue = _value({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: date, limit, window: date.getTime(), currentValue: bucketValue});
      
      assert.strictEqual(tokens, 0);
    }),

    it("should return more tokens than we have if at least one 'tick' has elapsed", () => {
      const date = new Date(0);
      const tick = new Date(new Date(0).setUTCMinutes(1));


      const limit = 10;
      const bucketValue = _value({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: tick, limit, window: tick.getTime(), currentValue: bucketValue});
      
      assert.strictEqual(tokens, limit);
    })

    it("should return more tokens than we have, but not the full limit, if we start with none and the window has not fully elapsed", () => {
      const date = new Date(0);
      const tick = new Date(new Date(0).setUTCMinutes(3));
      const window =  new Date(new Date(0).setUTCMinutes(10));

      const limit = 10;
      const bucketValue = _value({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: tick, limit, window: window.getTime(), currentValue: bucketValue});
      
      assert.strictEqual(tokens, 3);
    })
  })

  describe("rate limiting strategy", () => {
    it("should not rate limit if this is the first request", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Does not exist";

      const rateLimited = TokenBucketRateLimiter(InMemoryStore(), 10, window)(id);

      assert.strictEqual(rateLimited, false);
    });

    it("should rate limit if the limit is 0", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Does not exist";

      const rateLimited = TokenBucketRateLimiter(InMemoryStore(), 0, window)(id);

      assert.strictEqual(rateLimited, true);
    })

    it("should rate limit once all tokens are consumed", () => {
      const window = new Date(0).setUTCMinutes(1);
      const id = "Exists";
      const limit = 3;
      const store = InMemoryStore();

      const call1 = TokenBucketRateLimiter(store, limit, window)(id);
      const call2 = TokenBucketRateLimiter(store, limit, window)(id);
      const call3 = TokenBucketRateLimiter(store, limit, window)(id);
      const call4 = TokenBucketRateLimiter(store, limit, window)(id);

      assert.strictEqual(call1, false);
      assert.strictEqual(call2, false);
      assert.strictEqual(call3, false);
      assert.strictEqual(call4, true);
    })

    it("should replenish tokens if we wait for the time limit", async () => {
      const window = new Date(0).setUTCSeconds(1);
      const id = "Exists";
      const limit = 3;
      const store = InMemoryStore();

      const call1 = TokenBucketRateLimiter(store, limit, window)(id);
      const call2 = TokenBucketRateLimiter(store, limit, window)(id);
      const call3 = TokenBucketRateLimiter(store, limit, window)(id);
      const call4 = TokenBucketRateLimiter(store, limit, window)(id);

      assert.strictEqual(call1, false);
      assert.strictEqual(call2, false);
      assert.strictEqual(call3, false);
      assert.strictEqual(call4, true);

      await new Promise(r => setTimeout(r, window));

      const call5 = TokenBucketRateLimiter(store, limit, window)(id);
      assert.strictEqual(call5, false);
    })
  })
})