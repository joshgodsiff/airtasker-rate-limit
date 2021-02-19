function _tokensAvailable({time, limit, window, value}) {
  // Divide by 0 check
  if (limit === 0 || time.getTime() === value.timestamp.getTime()) {
    return value.tokens;
  }

  const slice = window / limit; // The time value of one "token";

  const timeDiff = time.getTime() - value.timestamp.getTime();
  const slicesInDiff = Math.floor(timeDiff / slice);

  if (slicesInDiff > limit) {
    return limit
  } else if (slicesInDiff <= 0) {
    return value.tokens
  } else {
    return slicesInDiff + value.tokens;
  }
}

function _token({timestamp, tokens}) {
  return {
    timestamp,
    tokens
  }
}

export { // Exported for testing purposes.
  _tokensAvailable,
  _token
}

// Public ---------------------------------------------------------------------

const TokenBucketStrategy = {
  getUpToDateValue: _tokensAvailable,
  hasSpareCapacity: ({upToDateValue}) => upToDateValue > 0,
  nextValueOnSuccess: ({upToDateValue, timestamp}) => _token({timestamp, tokens: upToDateValue - 1}),
  shouldSetOnLimit: false,
  nextValueOnLimit: () => {throw new Error("TokenBucketStrategy.nextValueOnLimit should never be called")},
  freshValue: ({timestamp, limit}) => _token({timestamp, tokens: limit - 1}),
  serialize: ({timestamp, tokens}) => JSON.stringify({timestamp: timestamp.getTime(), tokens}),
  deserialize: (string) => {
    const parsed = JSON.parse(string)
    return _token({timestamp: new Date(parsed.timestamp), tokens: parsed.tokens})
  },
  timeUntilNotLimited: ({window, limit}) => {
    if (limit <= 0) {
      return "infinite";
    } else {
      return new Date(window / limit);
    }
  }
}

function rateLimiter(store, limit, window) {
  return function(id) {
    return _rateLimiter({store, limit, window, id})
  }
}

export {
  TokenBucketStrategy
}