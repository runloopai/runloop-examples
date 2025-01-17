declare class EdgeExternalAppTest {
    readonly apiKey: string;
    url: string;
    constructor(apiKey: string, url: string);
    hitEndpoint: (url: string) => Promise<any>;
    assertOnResponse: () => Promise<any>;
}
declare const apiKey: string | undefined;
declare const url: string;
declare const assertOnResponse: () => Promise<any>;
