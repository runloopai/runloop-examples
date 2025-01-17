import { E as EnumerableStringKeyedValueOf } from './EnumerableStringKeyedValueOf-CLzltniW.js';
import { E as EnumerableStringKeyOf } from './EnumerableStringKeyOf-BQ4aR5ep.js';

/**
 * This is the type you'd get from doing:
 * `Object.fromEntries(Object.entries(x))`.
 */
type ReconstructedRecord<T> = Record<EnumerableStringKeyOf<T>, EnumerableStringKeyedValueOf<T>>;

export type { ReconstructedRecord as R };
