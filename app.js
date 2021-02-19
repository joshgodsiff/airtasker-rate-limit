import express from 'express';
import { InMemoryStore } from './InMemory.js';
import { RedisStore } from './Redis.js';
import { TokenBucketStrategy } from './TokenBucket.js';
import { RateLimiter } from './RateLimiter.js';
import { SlidingLogStrategy } from './SlidingLog.js';

const app = express();
const port = 8000;

const oneHour = new Date(0).setUTCHours(1); // Careful, this is a number, not a Date object.

const limiter = RateLimiter({store: InMemoryStore(), strategy: SlidingLogStrategy, limit: 100, window: oneHour});

app.get('/', (req, res) => {
  const onLimit = (timeout) => {
    res.status(429);
    const seconds = timeout.getTime() / 1000;
    res.send(`Rate limit exceeded. Try again in ${seconds} seconds`)
  }

  const onSuccess = () => {
    res.send("Success");
  }

  limiter.rateLimitWithCb({idFunc: () => "Fake ID", onLimit, onSuccess })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
