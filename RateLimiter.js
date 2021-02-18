const noop = () => {};
const defaults = {onLimit: noop, onSuccess: noop}

function genericRateLimiter({store, strategy, limit, window, id}) {
  const now = new Date();
  if (store.has(id)) {
    const value = store.get(id);

    const upToDateValue = strategy.getUpToDateValue({time: now, limit, window, value})
    const hasSpareCapacity = strategy.hasSpareCapacity({upToDateValue, limit, window})

    if (hasSpareCapacity) {
      const newValue = strategy.nextValueOnSuccess({timestamp: now, upToDateValue})
      store.set(id, newValue)
    } else if (strategy.shouldSetOnLimit) {
      store.set(id, strategy.nextValueOnLimit({timestamp: now, upToDateValue, limit, window}))
    } // Else case deliberately omitted

    return !hasSpareCapacity;
  } else {
    if (limit > 0) {
      store.set(id, strategy.freshValue({timestamp: now, limit, window}))
    }

    return limit <= 0;
  }
}

function curriedRateLimiter({store, strategy, limit, window}) {
  return function(args) {
    const {id, onLimit, onSuccess} = {...defaults, ...args};

    const isRateLimited = genericRateLimiter({store, strategy, limit, window, id});
  
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
    // rateLimit: rateLimit(strategy(store(), limit, window))
    rateLimit: curriedRateLimiter({store: store(), strategy, limit, window})
  }
}

export { RateLimiter }