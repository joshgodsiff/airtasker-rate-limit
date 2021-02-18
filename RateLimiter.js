async function genericRateLimiter({store, strategy, limit, window, id}) {
  const now = new Date();

  if (await store.has(id)) {
    const value = strategy.deserialize(await store.get(id));

    const upToDateValue = strategy.getUpToDateValue({time: now, limit, window, value})
    const hasSpareCapacity = strategy.hasSpareCapacity({upToDateValue, limit, window})

    if (hasSpareCapacity) {
      const newValue = strategy.nextValueOnSuccess({timestamp: now, upToDateValue})
      await store.set(id, strategy.serialize(newValue))

    } else if (strategy.shouldSetOnLimit) {
      await store.set(id, strategy.serialize(strategy.nextValueOnLimit({timestamp: now, upToDateValue, limit, window})))
    } // Else case deliberately omitted

    return !hasSpareCapacity;
  } else {
    if (limit > 0) {
      await store.set(id, strategy.serialize(strategy.freshValue({timestamp: now, limit, window})))
    }

    return limit <= 0;
  }
}

function curriedRateLimiter({store, strategy, limit, window}) {
  return function(id) {
    return genericRateLimiter({store, strategy, limit, window, id});
  }
}

const noop = () => {};
const defaults = {onLimit: noop, onSuccess: noop}

function rateLimiterWithCb({store, strategy, limit, window}) {
  return async function(args) {
    const {id, onLimit, onSuccess} = {...defaults, ...args};

    const isRateLimited = await genericRateLimiter({store, strategy, limit, window, id});

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
    rateLimit: curriedRateLimiter({store, strategy, limit, window}),
    rateLimitWithCb: rateLimiterWithCb({store, strategy, limit, window})
  }
}

export { RateLimiter }