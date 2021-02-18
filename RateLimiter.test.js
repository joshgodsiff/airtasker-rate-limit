import assert from 'assert';

import { SlidingLogRateLimiter, SlidingLogStrategy } from './SlidingLog.js';
import { TokenBucketRateLimiter, TokenBucketStrategy } from './TokenBucket.js';
import { RedisStore } from './Redis.js'
import { InMemoryStore } from './InMemory.js';
import { RateLimiter } from './RateLimiter.js';

// The default config works on my system.
// Documentation here: https://www.npmjs.com/package/redis#options-object-properties
const RedisConfig = {}

function dontRateLimitOnFirstRequest(store, strategy) {
  return async function() {
    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store: store(), strategy, window, limit: 10})
    const rateLimited = limiter.rateLimit({id});

    assert.strictEqual(await rateLimited, false);
  }
}

function rateLimitIfLimitIsZero(store, strategy) {
  return async function() {
    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store: store(), strategy, window, limit: 0})

    const rateLimited = await limiter.rateLimit({id});

    assert.strictEqual(rateLimited, true);
  }
}

function shouldRateLimitOnceLimitIsExceeded(store, strategy) {
  return async function() {
    const window = new Date(0).setUTCMinutes(1);
    const id = "Exists";

    const limiter = RateLimiter({store: store(), strategy, window, limit: 3})
  
    const call1 = await limiter.rateLimit({id});
    const call2 = await limiter.rateLimit({id});
    const call3 = await limiter.rateLimit({id});
    const call4 = await limiter.rateLimit({id});
  
    assert.strictEqual(call1, false);
    assert.strictEqual(call2, false);
    assert.strictEqual(call3, false);
    assert.strictEqual(call4, true);
  }
}

function shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(store, strategy) {
  return async function() {
    const window = new Date(0).setUTCSeconds(1);
    const id = "Exists";

    const limiter = RateLimiter({store: store(), strategy, window, limit: 3})
  
    const call1 = await limiter.rateLimit({id});
    const call2 = await limiter.rateLimit({id});
    const call3 = await limiter.rateLimit({id});
    const call4 = await limiter.rateLimit({id});
  
    assert.strictEqual(call1, false);
    assert.strictEqual(call2, false);
    assert.strictEqual(call3, false);
    assert.strictEqual(call4, true);
  
    await new Promise(r => setTimeout(r, window));
  
    const call5 = await limiter.rateLimit({id});
    assert.strictEqual(call5, false);
  }
}

describe("Rate Limiting", () => {
  describe("using a Sliding Log with an In Memory Store", () => {
    it("should not rate limit if this is the first request",  dontRateLimitOnFirstRequest(InMemoryStore, SlidingLogStrategy));
    it("should rate limit if the limit is 0",                 rateLimitIfLimitIsZero(InMemoryStore, SlidingLogStrategy))
    it("should rate limit once the log exceeds the limit",    shouldRateLimitOnceLimitIsExceeded(InMemoryStore, SlidingLogStrategy))
    it("should remove log entries older than the time limit", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(InMemoryStore, SlidingLogStrategy))
  })

  describe ("Using a Token Window with an In Memory Store", () => {
    it("should not rate limit if this is the first request",      dontRateLimitOnFirstRequest(InMemoryStore, TokenBucketStrategy));
    it("should rate limit if the limit is 0",                     rateLimitIfLimitIsZero(InMemoryStore, TokenBucketStrategy))
    it("should rate limit once out of tokens",                    shouldRateLimitOnceLimitIsExceeded(InMemoryStore, TokenBucketStrategy))
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(InMemoryStore, TokenBucketStrategy))
  })

  describe ("Using a Token Bucket with Redis Store", () => {
    var store = {}; // Needs to be a reference so we can pass it before its set.

    before(async () => {
      store.store = RedisStore(RedisConfig);
    })

    beforeEach(async () => {
      await store.store.clear();
    })

    it("should not rate limit if this is the first request",                 dontRateLimitOnFirstRequest(() => store.store, TokenBucketStrategy));
    it("should rate limit if the limit is 0",                                rateLimitIfLimitIsZero(() => store.store, TokenBucketStrategy))
    it("should rate limit once out of tokens",                               shouldRateLimitOnceLimitIsExceeded(() => store.store, TokenBucketStrategy))
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(() => store.store, TokenBucketStrategy))

    after(async () => {
      await store.store.clear();
      await store.store.close();
    })
  })

  describe ("Using a Sliding Window with Redis Store", () => {
    var store = {}; // Needs to be a reference so we can pass it before its set.

    before(async () => {
      store.store = RedisStore(RedisConfig);
    })

    beforeEach(async () => {
      await store.store.clear();
    })

    it("should not rate limit if this is the first request",                 dontRateLimitOnFirstRequest(() => store.store, SlidingLogStrategy));
    it("should rate limit if the limit is 0",                                rateLimitIfLimitIsZero(() => store.store, SlidingLogStrategy))
    it("should rate limit once out of tokens",                               shouldRateLimitOnceLimitIsExceeded(() => store.store, SlidingLogStrategy))
    it("should return some tokens once the timestamp is outside the window", shouldAcceptRequestsAgainOnceEnoughTimeHasPassed(() => store.store, SlidingLogStrategy))

    after(async () => {
      await store.store.clear();
      await store.store.close();
    })
  })
})