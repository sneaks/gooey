/**
 * Server-side key-value store singleton.
 * Persists data between graph runs / schedule ticks for the lifetime
 * of the server process. Keys are namespaced to avoid collisions
 * between different graphs.
 */

type KVValue = string | number | boolean | object | null;

class KVStore {
  private store = new Map<string, KVValue>();

  private ns(namespace: string, key: string): string {
    return `${namespace}::${key}`;
  }

  get(namespace: string, key: string): KVValue | undefined {
    return this.store.get(this.ns(namespace, key));
  }

  set(namespace: string, key: string, value: KVValue): void {
    this.store.set(this.ns(namespace, key), value);
  }

  delete(namespace: string, key: string): boolean {
    return this.store.delete(this.ns(namespace, key));
  }

  has(namespace: string, key: string): boolean {
    return this.store.has(this.ns(namespace, key));
  }

  /** Returns all key-value pairs in a namespace as a plain object */
  getAll(namespace: string): Record<string, KVValue> {
    const prefix = `${namespace}::`;
    const result: Record<string, KVValue> = {};
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(prefix)) {
        result[k.slice(prefix.length)] = v;
      }
    }
    return result;
  }

  /** Clear all keys in a namespace */
  clearNamespace(namespace: string): number {
    const prefix = `${namespace}::`;
    let count = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }

  get size(): number {
    return this.store.size;
  }
}

export const kvStore = new KVStore();
