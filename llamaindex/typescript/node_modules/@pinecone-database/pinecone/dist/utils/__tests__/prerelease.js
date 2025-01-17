"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prerelease_1 = require("../prerelease");
test('confirm featureFlag prints correct message, given API Version', function () {
    var testApiVersion = '2.2.2';
    // All method decorators in TypeScript need target, key, and descriptor arguments:
    var target = {}; // This would be the class prototype in a real use case
    var propertyKey = 'methodToDecorate'; // Name of the method being decorated
    var originalMethod = jest.fn(); // Mock the original method pre-decoration
    var descriptor = {
        value: originalMethod, // The actual method being decorated
    };
    // Apply the decorator
    var result = (0, prerelease_1.prerelease)(testApiVersion)(target, propertyKey, descriptor);
    // Spy on console.warn to confirm the warning message
    var consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // Call the decorated method
    result.value();
    // Verify that the warning was printed
    expect(consoleWarnSpy).toHaveBeenCalledWith("This is a prerelease feature implemented against the ".concat(testApiVersion, " version of our API."));
    // Verify that the original method was called
    expect(originalMethod).toHaveBeenCalled();
    // Restore the original console.warn
    consoleWarnSpy.mockRestore();
});
//# sourceMappingURL=prerelease.js.map