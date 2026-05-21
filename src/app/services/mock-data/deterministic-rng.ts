/**
 * Seeded pseudo-random number generator (mulberry32).
 * Same seed produces the same sequence across runs.
 */
export class DeterministicRng {
    private state: number;

    constructor(seed: number | string) {
        this.state = hashSeed(seed);
    }

    /** Returns a float in [0, 1). */
    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pick<T>(items: readonly T[]): T {
        if (items.length === 0) {
            throw new Error('Cannot pick from an empty array');
        }
        return items[this.nextInt(0, items.length - 1)];
    }

    shuffle<T>(items: T[]): T[] {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}

function hashSeed(seed: number | string): number {
    if (typeof seed === 'number' && Number.isFinite(seed)) {
        return seed >>> 0;
    }
    const str = String(seed);
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return (h >>> 0) || 1;
}
