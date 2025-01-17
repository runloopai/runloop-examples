import { N as NarrowedTo } from './NarrowedTo-CDIykNaN.js';
import 'type-fest';

/**
 * A function that checks if the passed parameter is a string and narrows its type accordingly.
 *
 * @param data - The variable to check.
 * @returns True if the passed input is a string, false otherwise.
 * @signature
 *    R.isString(data)
 * @example
 *    R.isString('string') //=> true
 *    R.isString(1) //=> false
 * @category Guard
 */
declare function isString<T>(data: T | string): data is NarrowedTo<T, string>;

export { isString };
