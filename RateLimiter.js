/*
  Rate limiting algorithm which can - in principle at least - make use of any
  sort of rate-limiting strategy or KV data store that supports the requisite
  interface.
*/

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

    return {
      limited: !hasSpareCapacity,
      timeout: strategy.timeUntilNotLimited({upToDateValue, window, limit, time: now})
    };
  } else {
    const upToDateValue = strategy.freshValue({timestamp: now, limit, window})
    const limited = limit <= 0;
    if (!limited) {
      await store.set(id, strategy.serialize(upToDateValue))
    }

    return {
      limited,
      timeout: strategy.timeUntilNotLimited({upToDateValue, window, limit, time: now})
    };
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

    const {limited, timeout} = await genericRateLimiter({store, strategy, limit, window, id});

    if (limited) {
      onLimit(timeout);
    } else {
      onSuccess();
    }

    return {limited, timeout};
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