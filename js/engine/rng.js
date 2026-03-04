// Mulberry32 seeded PRNG - fast, high quality, reproducible
export class RNG {
  constructor(seed) {
    this.seed = (seed >>> 0) || 0xDEADBEEF;
  }

  next() {
    this.seed += 0x6D2B79F5;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer in [min, max] inclusive
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Float in [min, max)
  float(min, max) {
    return this.next() * (max - min) + min;
  }

  // Pick random element from array
  pick(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Weighted pick: items = [{value, weight}, ...]
  weightedPick(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let r = this.next() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.value;
    }
    return items[items.length - 1].value;
  }

  // Shuffle array in place (Fisher-Yates)
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Roll NdS dice
  roll(n, s) {
    let total = 0;
    for (let i = 0; i < n; i++) total += this.int(1, s);
    return total;
  }

  // Returns true with given percent chance (0-100)
  chance(percent) {
    return this.next() * 100 < percent;
  }

  // Generate a word from a simple syllable system
  word(minSyl = 2, maxSyl = 3) {
    const onsets = ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w'];
    const nuclei = ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'oo', 'ou'];
    const codas = ['', '', '', '', 'n', 'r', 'l', 's', 'nd', 'nt', 'rk', 'st', 'th'];
    const count = this.int(minSyl, maxSyl);
    let word = '';
    for (let i = 0; i < count; i++) {
      word += this.pick(onsets) + this.pick(nuclei) + this.pick(codas);
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}
