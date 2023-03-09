import { z } from "zod";
import { HttpMethod } from "../types";
import api from "./api";
import { fetcher } from "./fetcher";
import { Logger } from "./log";

type BuildOptions = {
  logger?: Logger;
  name?: string;
};
type BuilderOptions<T extends z.ZodTypeAny, U extends z.ZodTypeAny> = {
  pathnameOrUrl: string;
  schemas: {
    input: T;
    response: U;
  };
  method?: HttpMethod;
  token?: string;
};

const build =
  (
    baseUrl: string,
    auth: () => Promise<string>,
    { logger = () => {}, name = "build" }: BuildOptions
  ) =>
  async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>({
    pathnameOrUrl,
    schemas,
    method = "POST",
    token,
  }: BuilderOptions<T, U>) => {
    let url: string;
    if (pathnameOrUrl.startsWith("https://")) {
      url = `${pathnameOrUrl}`;
    } else {
      url = `${baseUrl}${pathnameOrUrl}`;
    }

    const _token = token || (await auth());

    try {
      const data = await api(
        {
          inputSchema: schemas.input,
          outputSchema: schemas.response,
          options: {
            logger,
            name,
          },
        },
        (args) =>
          fetcher({
            method,
            url,
            token: _token,
            args,
          })
      );

      return data;
    } catch (err) {
      throw err;
    }
  };

export default build;
export { build };

async function test() {
  const builder = build("", async () => "", {});

  const i = await builder({
    pathnameOrUrl: "",
    schemas: {
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      response: z.object({
        id: z.string(),
        name: z.string(),
      }),
    },
    method: "POST",
    token: "",
  });

  const me = await i({
    username: "me",
    password: "me",
  });
}
