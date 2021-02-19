/*
  A Redis-backed datastore, usable in the rate-limiting algorithm.

  Unsurprisingly, won't work if there is no Redis server for it to connect to.
*/

import redis from 'redis';
import util from 'util';

async function RedisStore(options, onError = () => {}) {

  const client = await redis.createClient(options);
  client.on("error", onError);
  const asyncGet = util.promisify(client.get).bind(client);
  const asyncExists = util.promisify(client.exists).bind(client);
  const asyncSet = util.promisify(client.set).bind(client);
  const asyncFlush = util.promisify(client.flushall).bind(client);
  const asyncQuit = util.promisify(client.quit).bind(client);

  return {
    has: asyncExists,
    get: asyncGet,
    set: asyncSet,
    clear: asyncFlush,
    close: asyncQuit
  }
}

export { RedisStore }