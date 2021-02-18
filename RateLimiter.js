const noop = () => {};

function rateLimit(limiter) {
  return function({idFunc, onLimit, onSuccess} = {onLimit: noop, onSuccess: noop}) {
    const id = idFunc();
    const isRateLimited = limiter(id);
  
    if (isRateLimited) {
      onLimit();
    } else {
      onSuccess();
    }

    return isRateLimited;
  }
}

// Public ---------------------------------------------------------------------

function RateLimiter({store, strategy, limit, window}) {
  return {
    rateLimit: rateLimit(strategy(store(), limit, window))
  }
}

export { RateLimiter }