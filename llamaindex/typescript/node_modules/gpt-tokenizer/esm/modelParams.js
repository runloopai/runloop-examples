import { Cl100KBase } from './encodingParams/cl100k_base.js';
import { O200KBase } from './encodingParams/o200k_base.js';
import { P50KBase } from './encodingParams/p50k_base.js';
import { P50KEdit } from './encodingParams/p50k_edit.js';
import { R50KBase } from './encodingParams/r50k_base.js';
export function getEncodingParams(encodingName, getMergeableRanks) {
    const mergeableBytePairRanks = getMergeableRanks(encodingName);
    switch (encodingName.toLowerCase()) {
        case 'r50k_base':
            return R50KBase(mergeableBytePairRanks);
        case 'p50k_base':
            return P50KBase(mergeableBytePairRanks);
        case 'p50k_edit':
            return P50KEdit(mergeableBytePairRanks);
        case 'cl100k_base':
            return Cl100KBase(mergeableBytePairRanks);
        case 'o200k_base':
            return O200KBase(mergeableBytePairRanks);
        default:
            throw new Error(`Unknown encoding name: ${encodingName}`);
    }
}
//# sourceMappingURL=modelParams.js.map