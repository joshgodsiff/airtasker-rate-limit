/*
  A Sliding Log strategy for rate limiting.
  We keep a lot of all successful requests that a particular ID has made
  within a configured timeframe, and if there are too many entries in the log,
  then we rate-limit (deny) the request.

  The log is updated for every request (in that we delete entries outside the
  window). Unsuccessful requests are not written to the log.
*/

import Queue from 'queue-fifo';

function _withinWindow({time, window, logEntry}) {
  return time.getTime() - logEntry.getTime() < window;
}

function _cleanupOldEntries({time, window, log}) {
  while (!log.isEmpty() && !_withinWindow({time, window, logEntry: log.peek()})) {
    log.dequeue();
  }

  return log;
}

export { // Exported for testing purposes
  _withinWindow,
  _cleanupOldEntries
}

// Public ---------------------------------------------------------------------

const SlidingLogStrategy = {
  getUpToDateValue: ({time, window, value}) => _cleanupOldEntries({time, window, log: value}),
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
  },
  serialize: (queue) => {
    const arr = queue._list.toArray();
    return JSON.stringify(arr.map(date => date.getTime()))
  },
  deserialize: (string) => {
    const parsed = JSON.parse(string)
    const q = new Queue();
    parsed.map(e => q.enqueue(new Date(e)))
    return q;
  },
  timeUntilNotLimited: ({time, window, upToDateValue}) => {
    const timeWindowDiff = time.getTime() - window;
    return new Date(upToDateValue.peek().getTime() - timeWindowDiff);
  }
}

export {
  SlidingLogStrategy
}