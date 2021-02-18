import redis from 'redis';
import util from 'util';

function RedisStore(options) {

  const client = redis.createClient(options);
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