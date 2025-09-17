import {
  afterEach as nodeAfterEach,
  beforeEach as nodeBeforeEach,
  describe as nodeDescribe,
  it as nodeIt,
  test as nodeTest
} from "node:test";
import assert from "node:assert/strict";

export const describe = nodeDescribe;
export const it = nodeIt;
export const test = nodeTest;
export const beforeEach = nodeBeforeEach;
export const afterEach = nodeAfterEach;

function createMatcher(received) {
  return {
    toBe(expected) {
      assert.strictEqual(received, expected);
    },
    toEqual(expected) {
      assert.deepStrictEqual(received, expected);
    },
    toThrowError(expected) {
      if (typeof received !== "function") {
        throw new TypeError("toThrowError matcher expects a function");
      }
      if (expected === undefined) {
        assert.throws(received);
      } else {
        assert.throws(received, expected);
      }
    }
  };
}

export function expect(received) {
  return createMatcher(received);
}
