/**
 * Generic min-heap bounded to a fixed capacity (Top-K heap).
 *
 * Maintains the K largest elements seen so far using a min-heap so that
 * eviction of the smallest element is O(log K).  Overall complexity for
 * processing N notifications: O(N log K).
 *
 * @template T
 */
export class TopKHeap {
  /**
   * @param {number} limit  Maximum number of elements to retain.
   * @param {(a: T, b: T) => number} compareFn
   *   Returns negative if `a` has higher priority than `b` (min-heap order).
   *   The element at the root is the one with the *lowest* priority and will
   *   be evicted first when the heap is full.
   */
  constructor(limit, compareFn) {
    this.limit = limit;
    this.compareFn = compareFn;
    /** @type {T[]} */
    this.items = [];
  }

  /** Current number of elements in the heap. */
  size() {
    return this.items.length;
  }

  /** Element at the root (lowest priority, first to be evicted). */
  peek() {
    return this.items[0] ?? null;
  }

  /**
   * Insert an element.  If the heap is already at capacity and the new element
   * has higher priority than the root, the root is replaced.
   * @param {T} item
   */
  insert(item) {
    if (this.limit <= 0) return;

    if (this.size() < this.limit) {
      this.items.push(item);
      this._bubbleUp(this.items.length - 1);
      return;
    }

    // Only replace if new item has strictly higher priority than the weakest
    if (this.compareFn(item, this.peek()) > 0) {
      this.items[0] = item;
      this._bubbleDown(0);
    }
  }

  /**
   * Return all elements sorted from highest to lowest priority.
   * @returns {T[]}
   */
  toSortedArray() {
    return [...this.items].sort((a, b) => this.compareFn(b, a));
  }

  // ── private helpers ──────────────────────────────────────────────────────

  _bubbleUp(index) {
    let cur = index;
    while (cur > 0) {
      const parent = Math.floor((cur - 1) / 2);
      if (this.compareFn(this.items[cur], this.items[parent]) >= 0) break;
      [this.items[cur], this.items[parent]] = [this.items[parent], this.items[cur]];
      cur = parent;
    }
  }

  _bubbleDown(index) {
    let cur = index;
    const n = this.items.length;
    while (true) {
      const left = cur * 2 + 1;
      const right = left + 1;
      let smallest = cur;

      if (left < n && this.compareFn(this.items[left], this.items[smallest]) < 0)
        smallest = left;
      if (right < n && this.compareFn(this.items[right], this.items[smallest]) < 0)
        smallest = right;
      if (smallest === cur) break;

      [this.items[cur], this.items[smallest]] = [this.items[smallest], this.items[cur]];
      cur = smallest;
    }
  }
}
