import { z } from "zod";
import { generateError } from "zod-error";

/**
 *
 * @param schema ZodSchema object
 * @param args any input data
 * @returns typed valid data or throw a descriptive error when invalid
 */
function validate<T extends z.ZodTypeAny>(
  schema: T,
  args: unknown
): T["_output"] {
  try {
    const _ = schema.parse(args);
    return _;
  } catch (error) {
    throw new Error(generateError(error).message);
  }
}

export { validate };
