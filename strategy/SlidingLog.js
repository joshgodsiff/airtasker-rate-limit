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

function _rateLimiter({store, limit, window, id}) {
  return store.transaction((t) => {
    if (t.has(id)) {
      const log = t.get(id);

      const cleanedLog = cleanupOldEntries({time: new Date(), window, log})

      if (cleanedLog.size() < limit) {
        cleanedLog.enqueue(new Date());
        t.set(id, cleanedLog)

        return false;
      } else {
        t.set(id, cleanedLog);

        return true;
      }      
    } else {
      const q = new Queue();
      q.enqueue(new Date());
      t.set(id, q);
      return limit <= 0;
    }
  });
}

// Public ---------------------------------------------------------------------

function rateLimiter(store, limit, window) {
  return function(id) {
    return _rateLimiter({store, limit, window, id})
  }
}

export { rateLimiter as SlidingLogRateLimiter }