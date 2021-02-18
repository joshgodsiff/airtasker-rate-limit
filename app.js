import express from 'express';
import { InMemoryStore } from './InMemory.js';
import { RedisStore } from './Redis.js';
import { TokenBucketStrategy } from './TokenBucket.js';
import { RateLimiter } from './RateLimiter.js';
import { SlidingLogStrategy } from './SlidingLog.js';

const app = express();
const port = 8000;

const tenSeconds = new Date(0).setUTCSeconds(10); // Careful, this is a number, not a Date object.

const limiter = RateLimiter({store: InMemoryStore(), strategy: TokenBucketStrategy, limit: 5, window: tenSeconds});

app.get('/', (req, res) => {
  const onLimit = () => {
    res.status(429);
    res.send("Limited")
  }

  const onSuccess = () => {
    res.send("Success");
  }

  limiter.rateLimitWithCb({idFunc: () => "Fake ID", onLimit, onSuccess })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
