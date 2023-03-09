import { Logger } from "./log";

type MethodOptions = {
  logger?: Logger;
  name?: string;
};

const method = async <T>(
  f: () => Promise<T>,
  { logger = () => {}, name = "unknown" }: MethodOptions
): Promise<T> => {
  logger("info", `${name} initializing`);

  try {
    logger("info", `${name} executing`);

    const data = await f();

    return data;
  } catch (err: unknown) {
    logger("error", `${name} failed`, { error: (err as Error).message });

    throw err;
  }
};

export default method;
export { method };
