import { NoInfer, PartialDeep } from "../types";

const fromPartial = <T>(mock: PartialDeep<NoInfer<T>>): T => {
  return mock as T;
};

export { fromPartial };

const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const clone = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
};

export { omit };
