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

  function transaction(fn) {
    return fn({has, get, set});
  }

  return {
    has,
    get,
    set,
    transaction
  }
}

export { InMemoryStore }