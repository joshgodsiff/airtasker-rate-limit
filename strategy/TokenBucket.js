function _tokensAvailable({time, limit, window, currentValue}) {
  // Divide by 0 check
  if (limit === 0 || time.getTime() === currentValue.timestamp.getTime()) {
    return currentValue.tokens;
  }

  const slice = window / limit; // The time value of one "token";

  const timeDiff = time.getTime() - currentValue.timestamp.getTime();
  const slicesInDiff = Math.floor(timeDiff / slice);

  if (slicesInDiff > limit) {
    return limit
  } else if (slicesInDiff <= 0) {
    return currentValue.tokens
  } else {
    return slicesInDiff + currentValue.tokens;
  }
}

function _value({timestamp, tokens}) {
  return {
    timestamp,
    tokens
  }
}

function _rateLimiter({store, limit, window, id}) {
  return store.transaction((t) => {
    if (t.has(id)) {
      const currentValue = t.get(id);
      const tokens = tokensAvailable({limit, window, currentValue});

      if (tokens > 0) {
        // the '-1' is for this request
        t.set(id, value(tokens - 1))
      }

      return tokens <= 0;
    } else {
      t.set(id, value(limit - 1));
      return limit <= 0;
    }
  });
}

export { // Exported for testing purposes.
  _tokensAvailable,
  _value
}

// Public ---------------------------------------------------------------------

function rateLimiter(store, limit, window) {
  return function(id) {
    return _rateLimiter({store, limit, window, id})
  }
}

function value(tokens) {
  return _value({timestamp: new Date(), tokens})
}

function tokensAvailable({limit, window, currentValue}) {
  return _tokensAvailable({time: new Date(), limit, window, currentValue});
}

export {
  rateLimiter as TokenBucketRateLimiter,
  tokensAvailable,
  value,
}