import { N as NarrowedTo } from './NarrowedTo-CDIykNaN.js';
import 'type-fest';

/**
 * A function that checks if the passed parameter is a bigint and narrows its
 * type accordingly.
 *
 * @param data - The variable to check.
 * @returns True if the passed input is a number, false otherwise.
 * @signature
 *    R.isBigInt(data)
 * @example
 *    R.isBigInt(1n); // => true
 *    R.isBigInt(1); // => false
 *    R.isBigInt('notANumber'); // => false
 * @category Guard
 */
declare function isBigInt<T>(data: T | bigint): data is NarrowedTo<T, bigint>;

export { isBigInt };
