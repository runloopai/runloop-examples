import { E as EnumerableStringKeyedValueOf } from './EnumerableStringKeyedValueOf-CLzltniW.cjs';
import { E as EnumerableStringKeyOf } from './EnumerableStringKeyOf-BQ4aR5ep.cjs';

/**
 * This is the type you'd get from doing:
 * `Object.fromEntries(Object.entries(x))`.
 */
type ReconstructedRecord<T> = Record<EnumerableStringKeyOf<T>, EnumerableStringKeyedValueOf<T>>;

export type { ReconstructedRecord as R };
