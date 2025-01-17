import { I as IterableContainer } from './IterableContainer-CtfinwiH.cjs';

type Mapped<T extends IterableContainer, K> = {
    -readonly [P in keyof T]: K;
};

export type { Mapped as M };
