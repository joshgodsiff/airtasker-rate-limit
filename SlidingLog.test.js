import assert from 'assert';
import Queue from 'queue-fifo';

import {
  _withinWindow,
  _cleanupOldEntries
} from './SlidingLog.js';

describe("Sliding Log", () => {
  it("Should calculate whether a log entry is in a time window", () => {
    const entryInWindow = new Date(42);
    const entryNotInWindow = new Date(39);
    const nominalCurrentTime = new Date(50);

    const window = new Date(10).getTime();

    const shouldBeWithinWindow = _withinWindow({time: nominalCurrentTime, window, logEntry: entryInWindow});
    assert.strictEqual(shouldBeWithinWindow, true);

    const shouldNotBeWithinWindow = _withinWindow({time: nominalCurrentTime, window, logEntry: entryNotInWindow});
    assert.strictEqual(shouldNotBeWithinWindow, false);
  });

  it("Should remove log entires that are outside the time window", () => {
    const q = new Queue();
    [1,2,3,4,5,6,7,8,9,10,11,12].map(i => q.enqueue(new Date(i)));
    const remaining = [6,7,8,9,10,11,12].map(i => new Date(i));
    const nominalCurrentTime = new Date(15);
    const window = new Date(10).getTime();

    const cleaned = _cleanupOldEntries({time: nominalCurrentTime, window, log: q});

    assert.strictEqual(cleaned.size(), remaining.length);
    assert.deepStrictEqual(cleaned._list.toArray(), remaining);
  });
})