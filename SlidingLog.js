import Queue from 'queue-fifo';

function withinWindow({time, window, logEntry}) {
  return time.getTime() - logEntry.getTime() < window;
}

function cleanupOldEntries({time, window, log}) {
  while (!log.isEmpty() && !withinWindow({time, window, logEntry: log.peek()})) {
    log.dequeue();
  }

  return log;
}

// Public ---------------------------------------------------------------------

const SlidingLogStrategy = {
  getUpToDateValue: ({time, window, value}) => cleanupOldEntries({time, window, log: value}),
  hasSpareCapacity: ({upToDateValue, limit}) => upToDateValue.size() < limit,
  nextValueOnSuccess: ({upToDateValue, timestamp}) => {
    upToDateValue.enqueue(timestamp)
    return upToDateValue;
  },
  shouldSetOnLimit: true,
  nextValueOnLimit: ({upToDateValue}) => upToDateValue,
  freshValue: ({timestamp}) => {
    const q = new Queue();
    q.enqueue(timestamp);
    return q;
  }
}

function rateLimiter(store, limit, window) {
  return function(id) {
    return _rateLimiter({store, limit, window, id})
  }
}

export {
  rateLimiter as SlidingLogRateLimiter,
  SlidingLogStrategy
}