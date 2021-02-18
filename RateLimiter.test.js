import assert from 'assert';

import { SlidingLogRateLimiter, SlidingLogStrategy } from './SlidingLog.js';
import { TokenBucketRateLimiter, TokenBucketStrategy } from './TokenBucket.js';
import { InMemoryStore } from './InMemory.js';
import { RateLimiter } from './RateLimiter.js';

function dontRateLimitOnFirstRequest(store, strategy) {
  return function(){
    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store, strategy, window, limit: 10})
    const rateLimited = limiter.rateLimit(id);

    assert.strictEqual(rateLimited, false);
  }
}

function rateLimitIfLimitIsZero(store, strategy) {
  return function() {
    const window = new Date(0).setUTCMinutes(1);
    const id = "Does not exist";

    const limiter = RateLimiter({store, strategy, window, limit: 0})

    const rateLimited = limiter.rateLimit(id);

    assert.strictEqual(rateLimited, true);
  }
}

function shouldRateLimitOnceLimitIsExceeded(store, strategy) {
  return function() {
    const window = new Date(0).setUTCMinutes(1);
    const id = "Exists";

    const limiter = RateLimiter({store, strategy, window, limit: 3})
  
    const call1 = limiter.rateLimit(id);
    const call2 = limiter.rateLimit(id);
    const call3 = limiter.rateLimit(id);
    const call4 = limiter.rateLimit(id);
  
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

    const limiter = RateLimiter({store, strategy, window, limit: 3})
  
    const call1 = limiter.rateLimit(id);
    const call2 = limiter.rateLimit(id);
    const call3 = limiter.rateLimit(id);
    const call4 = limiter.rateLimit(id);
  
    assert.strictEqual(call1, false);
    assert.strictEqual(call2, false);
    assert.strictEqual(call3, false);
    assert.strictEqual(call4, true);
  
    await new Promise(r => setTimeout(r, window));
  
    const call5 = limiter.rateLimit(id);
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
})