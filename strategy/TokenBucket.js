function tokensAvailable(limit, window, currentValue) {
  const now = new Date();

  const slice = window / limit; // The time value of one "token";

  const timeDiff = now.getTime() - currentValue.timestamp.getTime();
  const slicesInDiff = Math.floor(timeDiff / slice);

  if (slicesInDiff > limit) {
    return limit
  } else if (slicesInDiff <= 0) {
    return currentValue.tokens
  } else {
    return slicesInDiff + currentValue.tokens;
  }
}

function value(tokens) {
  return {
    timestamp: new Date(), // Now
    tokens
  }
}

function defaultValue(limit) {
  return {
    timestamp: new Date(0),
    tokens: limit
  }
}

function rateLimiter(store, limit, window) {
  return function(id) {
    return store.transaction((t) => {
      if (t.has(id)) {
        const currentValue = t.get(id);
        const tokens = tokensAvailable(limit, window, currentValue);

        console.log(currentValue, tokens);
  
        if (tokens) {
          // the '-1' is for this request
          t.set(id, value(tokens - 1))
        }
  
        return tokens <= 0;
      } else {
        t.set(id, defaultValue(limit));
      }
    });
  }
}

export { rateLimiter as TokenBucketRateLimiter }