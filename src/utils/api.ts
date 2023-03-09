import { z } from "zod";
import { generateError } from "./error";
import { Logger } from "./log";
import { baseAsync } from "./system";

type APIOptions<T extends z.ZodTypeAny, U extends z.ZodTypeAny> = {
  inputSchema: T;
  outputSchema: U;
  options?: {
    logger?: Logger;
    name?: string;
  };
};

const api = async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
  { inputSchema, outputSchema, options }: APIOptions<T, U>,
  fetcher: (input: z.infer<T>) => Promise<Response>
) => {
  const { logger = () => {}, name = "api" } = options ?? {};

  return await baseAsync<T, U>(
    inputSchema,
    outputSchema,
    async (args) => {
      const res = await fetcher(args);

      const data = await switchParser(res);

      // vonage errors
      if ([200, 201, 204].includes(res.status) === false) {
        const err = generateError(data);
        logger("error", `${name}: [x] vonage error`, { error: err.message });

        throw err;
      }

      return data;
    },
    { logger, name }
  );
};

export default api;
export { api };

function switchParser(response: Response) {
  const isJson = response.headers.get("content-type")?.includes("json");
  const isText = response.headers.get("content-type")?.includes("text");

  if (isJson) return response.json();
  if (isText) return response.text();
  return response.arrayBuffer();
}

async function test() {
  const i = await api(
    {
      inputSchema: z.object({
        username: z.string(),
        password: z.string(),
      }),
      outputSchema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      options: {
        logger: console.log,
        name: "me",
      },
    },
    function fetcher(input) {
      return fetch("https://example.com", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }
  );

  const me = await i({
    password: "password",
    username: "username",
  });
}
