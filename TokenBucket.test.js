import { 
  TokenBucketRateLimiter, 
  _tokensAvailable, 
  _token
} from './TokenBucket.js';

import { InMemoryStore } from './InMemory.js';

import assert from 'assert';

describe("TokenBucket", () => {
  describe("Calculating available tokens", () => {
    it("should return the maximum limit if we haven't used any tokens, regardless of timestamp", () => {
      const date = new Date(0);
      const limit = 10;
      const bucketValue = _token({timestamp: date, tokens: limit});
      const tokens = _tokensAvailable({time: date, limit, window: date.getTime(), value: bucketValue});

      assert.strictEqual(tokens, limit)
    }),

    it("should return no tokens available, if we start with no tokens and time has not moved", () => {
      const date = new Date(0);
      const limit = 10;
      const bucketValue = _token({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: date, limit, window: date.getTime(), value: bucketValue});
      
      assert.strictEqual(tokens, 0);
    }),

    it("should return more tokens than we have if at least one 'tick' has elapsed", () => {
      const date = new Date(0);
      const tick = new Date(new Date(0).setUTCMinutes(1));


      const limit = 10;
      const bucketValue = _token({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: tick, limit, window: tick.getTime(), value: bucketValue});
      
      assert.strictEqual(tokens, limit);
    })

    it("should return more tokens than we have, but not the full limit, if we start with none and the window has not fully elapsed", () => {
      const date = new Date(0);
      const tick = new Date(new Date(0).setUTCMinutes(3));
      const window =  new Date(new Date(0).setUTCMinutes(10));

      const limit = 10;
      const bucketValue = _token({timestamp: date, tokens: 0});
      const tokens = _tokensAvailable({time: tick, limit, window: window.getTime(), value: bucketValue});
      
      assert.strictEqual(tokens, 3);
    })
  })
})