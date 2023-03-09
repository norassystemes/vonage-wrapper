/**
 * from: https://github.com/mattpocock/mock-utils
 */
export type PartialDeep<T> = T extends (...args: any[]) => unknown
  ? T | undefined
  : T extends object
  ? T extends ReadonlyArray<infer ItemType> // Test for arrays/tuples, per https://github.com/microsoft/TypeScript/issues/35156
    ? ItemType[] extends T // Test for arrays (non-tuples) specifically
      ? readonly ItemType[] extends T // Differentiate readonly and mutable arrays
        ? ReadonlyArray<PartialDeep<ItemType | undefined>>
        : Array<PartialDeep<ItemType | undefined>>
      : PartialObjectDeep<T> // Tuples behave properly
    : PartialObjectDeep<T>
  : T;

export type PartialObjectDeep<ObjectType extends object> = {
  [KeyType in keyof ObjectType]?: PartialDeep<ObjectType[KeyType]>;
};

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type Promisable<T> = T | PromiseLike<T>;

export type Meta = {
  logger?: boolean;
  name?: string;
};

export type HttpMethod = "POST" | "PUT" | "PATCH" | "GET" | "DELETE";

export type VonageLists = "conversation" | "user" | "member" | "event" | "leg";
