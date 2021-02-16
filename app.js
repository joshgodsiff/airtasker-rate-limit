import express from 'express';
import { InMemoryStore } from './store/InMemory.js'
import { TokenBucketRateLimiter } from './strategy/TokenBucket.js'
import { RateLimiter } from './RateLimiter.js';

const app = express();
const port = 8000;

const tenSeconds = new Date(0).setUTCSeconds(10); // Careful, this is a number, not a Date object.

const limiter = RateLimiter({store: InMemoryStore, strategy: TokenBucketRateLimiter, limit: 5, window: tenSeconds});

app.get('/', (req, res) => {
  const onLimit = () => {
    res.status(429);
    res.send("Limited")
  }

  const onSuccess = () => {
    res.send("Success");
  }

  limiter.rateLimit({idFunc: () => "Fake ID", onLimit, onSuccess })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
