import { I as IterableContainer } from './IterableContainer-CtfinwiH.js';

type Mapped<T extends IterableContainer, K> = {
    -readonly [P in keyof T]: K;
};

export type { Mapped as M };
