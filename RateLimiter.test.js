import assert from 'assert';

import { SlidingLogStrategy } from './SlidingLog.js';
import { TokenBucketStrategy } from './TokenBucket.js';
import { RedisStore } from './Redis.js'
import { InMemoryStore } from './InMemory.js';
import { RateLimiter } from './RateLimiter.js';

// The default config works on my system.
// Documentation here: https://www.npmjs.com/package/redis#options-object-properties
const RedisConfig = {}
// This lets us determine whether Redis is available to run the Redis-based tests.
var redisSuccess = true;
var store = await RedisStore(RedisConfig, (err) => {
  redisSuccess = false
});

function dontRateLimitOnFirstRequest(store, strategy, shouldRunFn = () => true) {
  return async function() {
    if(!shouldRunFn()) {
      this.skip();
    }

    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store, strategy, window, limit: 10})
    const {limited} = await limiter.rateLimit(id);

    assert.strictEqual(limited, false);
  }
}

function rateLimitIfLimitIsZero(store, strategy, shouldRunFn = () => true) {
  return async function() {
    if(!shouldRunFn()) {
      this.skip();
    }

    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store, strategy, window, limit: 0})

    const {limited} = await limiter.rateLimit(id);

    assert.strictEqual(limited, true);
  }
}

function shouldRateLimitOnceLimitIsExceeded(store, strategy, shouldRunFn = () => true) {
  return async function() {
    if(!shouldRunFn()) {
      this.skip();
    }

    const window = new Date(0).setUTCMinutes(1);
    const id = "Exists";

    const limiter = RateLimiter({store, strategy, window, limit: 3})
  
    const {limited: call1} = await limiter.rateLimit(id);
    const {limited: call2} = await limiter.rateLimit(id);
    const {limited: call3} = await limiter.rateLimit(id);
    const {limited: call4} = await limiter.rateLimit(id);
  
    assert.strictEqual(call1, false);
    assert.strictEqual(call2, false);
    assert.strictEqual(call3, false);
    assert.strictEqual(call4, true);
  }
}

function shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(store, strategy, shouldRunFn = () => true) {
  return async function() {
    if(!shouldRunFn()) {
      this.skip();
    }

    const window = new Date(0).setUTCSeconds(1);
    const id = "Exists";

    const limiter = RateLimiter({store, strategy, window, limit: 3})
  
    const {limited: call1} = await limiter.rateLimit(id);
    const {limited: call2} = await limiter.rateLimit(id);
    const {limited: call3} = await limiter.rateLimit(id);
    const {limited: call4} = await limiter.rateLimit(id);
  
    assert.strictEqual(call1, false);
    assert.strictEqual(call2, false);
    assert.strictEqual(call3, false);
    assert.strictEqual(call4, true);
  
    await new Promise(r => setTimeout(r, window));
  
    const {limited: call5} = await limiter.rateLimit(id);
    assert.strictEqual(call5, false);
  }
}

describe("Rate Limiting", async () => {
  describe("using a Sliding Log with an In Memory Store", () => {
    it("should not rate limit if this is the first request",      dontRateLimitOnFirstRequest(InMemoryStore(), SlidingLogStrategy));
    it("should rate limit if the limit is 0",                     rateLimitIfLimitIsZero(InMemoryStore(), SlidingLogStrategy))
    it("should rate limit once the log exceeds the limit",        shouldRateLimitOnceLimitIsExceeded(InMemoryStore(), SlidingLogStrategy))
    it("should remove log entries older than the time limit",     shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(InMemoryStore(), SlidingLogStrategy))
  })

  describe ("Using a Token Window with an In Memory Store", () => {
    it("should not rate limit if this is the first request",                 dontRateLimitOnFirstRequest(InMemoryStore(), TokenBucketStrategy));
    it("should rate limit if the limit is 0",                                rateLimitIfLimitIsZero(InMemoryStore(), TokenBucketStrategy))
    it("should rate limit once out of tokens",                               shouldRateLimitOnceLimitIsExceeded(InMemoryStore(), TokenBucketStrategy))
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(InMemoryStore(), TokenBucketStrategy))
  })

  describe ("Using a Token Bucket with Redis Store", () => {
    beforeEach(() => {
      if (redisSuccess) {
        store.clear();
      }
    })

    it("should not rate limit if this is the first request",                 dontRateLimitOnFirstRequest(store, TokenBucketStrategy, () => redisSuccess));
    it("should rate limit if the limit is 0",                                rateLimitIfLimitIsZero(store, TokenBucketStrategy, () => redisSuccess));
    it("should rate limit once out of tokens",                               shouldRateLimitOnceLimitIsExceeded(store, TokenBucketStrategy, () => redisSuccess));
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(store, TokenBucketStrategy, () => redisSuccess));

    after(() => {
      if(redisSuccess) {
        store.clear();
      }
    })
  })

  describe ("Using a Sliding Window with Redis Store", () => {
    beforeEach(() => {
      if (redisSuccess) {
        store.clear();
      }
    })

    it("should not rate limit if this is the first request",                 dontRateLimitOnFirstRequest(store, SlidingLogStrategy, () => redisSuccess));
    it("should rate limit if the limit is 0",                                rateLimitIfLimitIsZero(store, SlidingLogStrategy, () => redisSuccess));
    it("should rate limit once out of tokens",                               shouldRateLimitOnceLimitIsExceeded(store, SlidingLogStrategy, () => redisSuccess));
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(store, SlidingLogStrategy, () => redisSuccess));

    after(() => {
      if(redisSuccess) {
        store.clear();
      }
    })
  })

  after(() => {
    store.close();
  })
})