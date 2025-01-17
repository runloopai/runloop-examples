import { I as IterableContainer } from './IterableContainer-CtfinwiH.cjs';

type ReorderedArray<T extends IterableContainer> = {
    -readonly [P in keyof T]: T[number];
};

export type { ReorderedArray as R };
