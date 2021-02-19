/*
  A simple in-memory key-value datastore, usable in the rate-limiting algorithm.
*/

function InMemoryStore() {

  const kvMap = new Map();

  function has(id) {
    return kvMap.has(id)
  }

  function get(id) {
    return kvMap.get(id);
  }

  function set(id, value) {
    return kvMap.set(id, value);
  }

  return {
    has,
    get,
    set,
  }
}

export { InMemoryStore }