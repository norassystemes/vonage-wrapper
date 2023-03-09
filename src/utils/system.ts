import { z } from "zod";
import { Logger } from "./log";
import { validate } from "./validation";

type BaseOptions = {
  logger?: Logger;
  name?: string;
};

type Base = <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
  input: T,
  output: U,
  func: (input: z.input<T>) => unknown
) => (data: z.input<T>) => z.infer<U>;

const base: Base = (input, output, func) => (data: unknown) => {
  const validInput = input.parse(data);
  const validOutput = output.parse(func(validInput));
  return validOutput;
};

const baseAsync =
  async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
    input: T,
    output: U,
    func: (input: z.input<T>) => Promise<unknown>,
    { logger = () => {}, name = "baseAsync" }: BaseOptions
  ) =>
  async (data: z.input<T>): Promise<z.infer<U>> => {
    try {
      logger("info", `${name}: validating input`, { data });
      const validInput = validate(input, data); // input.parse(data)
      logger("info", `${name}: [ok] input validated`, { validInput });

      logger("info", `${name}: calling function with`, { validInput });
      const valid = await func(validInput);
      logger("info", `${name}: [ok] function returned`, { valid });

      logger("info", `${name}: validating output`, { valid });
      const validOutput = validate(output, valid); // output.parse(valid)
      logger("info", `${name}: [ok] output validated`, { validOutput });

      return validOutput;
    } catch (error) {
      logger("error", `${name}: [x] error`, {
        error: (error as Error).message,
      });
      throw error;
    }
  };

export { base, baseAsync };
