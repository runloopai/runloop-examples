import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
export declare class Classifiers extends ClientSDK {
    /**
     * Moderations
     */
    moderate(request: components.ClassificationRequest, options?: RequestOptions): Promise<components.ClassificationResponse>;
    /**
     * Moderations Chat
     */
    moderateChat(request: components.ChatClassificationRequest, options?: RequestOptions): Promise<components.ClassificationResponse>;
}
//# sourceMappingURL=classifiers.d.ts.map