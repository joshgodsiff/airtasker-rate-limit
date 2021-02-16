function RateLimiter({store, strategy, limit, window}) {
  return {
    rateLimit: rateLimit(strategy(store(), limit, window))
  }
}

function rateLimit(limiter) {
  return function({idFunc, onLimit, onSuccess}) {
    const id = idFunc();
    const isRateLimited = limiter(id);
  
    if (isRateLimited) {
      onLimit();
    } else {
      onSuccess();
    }
  }
}

export { RateLimiter }