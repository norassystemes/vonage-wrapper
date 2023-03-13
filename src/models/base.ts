import { z } from "zod";
import { Main } from "../main";
import { HttpMethod, VonageLists } from "../types";
import { method as apiMethod, validate } from "../utils";

interface RunArgs<T extends z.ZodTypeAny, U extends z.ZodTypeAny> {
  inputSchema: T;
  outputSchema: U;
  url: string;
  input?: unknown;
  method?: HttpMethod;
  runName?: string;
  token?: string;
  noLogger?: boolean;
}
// ts-error: Exported variable 'x' has or is using name 'RunArgs' from external module
export { RunArgs };

const base = (main: Main, name: string) => {
  const run = async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
    args: RunArgs<T, U>
  ) => {
    const {
      inputSchema,
      outputSchema,
      url,
      input = {},
      method,
      runName = "unknown",
      token,
      noLogger = false,
    } = args;

    const builder = await apiMethod(
      () =>
        main.builder({
          pathnameOrUrl: url,
          schemas: {
            input: inputSchema,
            response: outputSchema,
          },
          method: method,
          token,
        }),
      { logger: noLogger ? () => {} : main.logger, name: `${name}.${runName}` }
    );

    let _url = "";
    if (url.startsWith("https://")) {
      _url = `${url}`;
    } else {
      _url = `${main.baseUrl}${url}`;
    }

    const data = await builder({
      url: _url,
      input,
    });

    return data;
  };

  return {
    create: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
      args: RunArgs<T, U>
    ) =>
      run({
        ...args,
        runName: "create",
      }),
    update: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
      args: RunArgs<T, U>
    ) =>
      run({
        method: "PUT",
        ...args,
        runName: "update",
      }),
    find: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
      args: RunArgs<T, U>
    ) =>
      run({
        ...args,
        method: "GET",
        runName: "find",
      }),
    delete: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
      args: RunArgs<T, U>
    ) =>
      run({
        ...args,
        method: "DELETE",
        runName: "delete",
      }),
    findMany: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(args: {
      args: RunArgs<T, U>;
      /**
       * make sure it's the same as the name coming in the api response
       * @default `name`
       */
      itemName?: VonageLists;
      /** default to `native` */
      type?: "loop" | "cursor" | "native" | "limitless";
      /** baseListUrl is required if you set type to "loop" */
      baseListUrl?: string;
      ids?: { id: string }[];
      /** extraSchema is required if you set type to "loop" */
      extraSchema?: z.ZodTypeAny;
    }) => {
      let {
        args: input,
        itemName = name,
        type,
        baseListUrl,
        ids,
        extraSchema,
      } = args;

      if (typeof type === "undefined") type = "native";
      const token = input.token || (await main.token());

      // get many by loop
      if (type === "loop") {
        if (!ids?.length) throw new Error("ids are required for loop type");
        if (!baseListUrl)
          throw new Error("baseListUrl is required for loop type");
        if (!extraSchema)
          throw new Error("extraSchema is required for loop type");

        const promises = [];

        for (const { id } of ids) {
          promises.push(
            run({
              ...input,
              outputSchema: extraSchema,
              // we will override the input
              url: `${baseListUrl}/${id}`,
              token,
              method: "GET",
              noLogger: true,
            })
          );
        }

        main.logger("info", `fetching ${promises.length} ${name} items...`);
        const data = await Promise.all(promises);
        main.logger("info", `fetched ${promises.length} ${name} items`, {
          data,
        });

        // we will emulate the api response
        const page_size = data.length;
        const response = {
          _embedded: {
            // conversations: data,
            [itemName + "s"]: data,
          },
          _links: {
            first: {
              href: `${main.baseUrl}${baseListUrl}?page_size=${page_size}`,
            },
            self: {
              href: `${main.baseUrl}${baseListUrl}?page_size=${page_size}`,
            },
          },
          page_size,
        };

        // have to validate because we're forcing the types on return
        const parsedResponse = input.outputSchema.parse(response);

        return parsedResponse as z.infer<typeof input.outputSchema>;
      }

      // get many by cursor
      if (type === "cursor") {
        if (!input.url) throw new Error("url is required for cursor type");

        const data = await run({
          ...input,
          token,
          method: "GET",
          runName: "findMany",
        });

        return data;
      }

      // get many native

      if (!input.inputSchema)
        throw new Error("inputSchema is required for native type");

      // if `limitless` we will not handle user preferences
      let url = input.url || baseListUrl;
      if (!url) throw new Error("url is required for native type");

      if (type === "limitless") {
        // ✅ get all items

        // api maximum/minimum allowed
        let max = 100;
        let min = 10;

        const _url = url.startsWith("http") ? url : main.baseUrl + url;

        const __url = new URL(_url);
        __url.searchParams.set("page_size", `${max}`);

        const data = await run({
          ...input,
          input: undefined,
          inputSchema: z.any(),
          url: __url.toString(),
          token,
          method: "GET",
          runName: "findMany",
        });
        const items = data._embedded[itemName + "s"];
        let hasNext = !!data._links.next;
        let count = items.length;
        let hits = 0;
        let tooMuch = 10000; // 😅
        let nextUrlToReturn = "";

        if (tooMuch < min) tooMuch = min;

        while (hasNext) {
          const nextUrl = new URL(data._links.next.href);

          // unnecessary check
          // const pageSize = Number(nextUrl.searchParams.get("page_size"));
          // if (pageSize !== max) {
          //   nextUrl.searchParams.set("page_size", `${max}`);
          // }

          // another call
          const nextPage = await run({
            ...input,
            input: undefined,
            inputSchema: z.any(),
            url: nextUrl.toString(),
            token,
            method: "GET",
            runName: "findMany",
          });

          count += nextPage._embedded[itemName + "s"].length;
          hits++;

          // merge the items
          items.push(...nextPage._embedded[itemName + "s"]);

          if (count >= tooMuch) {
            main.logger(
              "error",
              `🌋 Too many ${itemName}s, more than ${tooMuch}`
            );
            nextUrlToReturn = nextPage._links.next?.href;
            break;
          }
          // if above check didn't break the loop after a while
          // we will break it with `hits`
          if (hits > tooMuch / max) {
            main.logger(
              "info",
              `🌋 Something went wrong, we had to use a counter to break the loop after ${hits} hits`
            );
            break;
          }

          // is there a next page?
          hasNext = !!nextPage._links.next;
        }

        let response: any = {
          _embedded: {
            [itemName + "s"]: items,
          },
          _links: {
            first: {
              href: `${main.baseUrl}${url}?page_size=${items.length}`,
            },
            self: {
              href: `${main.baseUrl}${url}?page_size=${items.length}`,
            },
          },
          page_size: items.length,
        };

        if (items.length >= tooMuch && !!nextUrlToReturn) {
          response = {
            ...response,
            _links: {
              ...response._links,
              next: {
                href: nextUrlToReturn,
              },
            },
          };
        }

        // have to validate because we're forcing the types on return
        const parsedResponse = input.outputSchema.parse(response);

        return parsedResponse as z.infer<typeof input.outputSchema>;
      }

      // validate the input
      let _args = {} as z.infer<typeof input.inputSchema>;
      try {
        _args = validate(input.inputSchema, input.input);
      } catch (err) {
        throw err;
      }

      // set query params
      const searchParams = new URLSearchParams();

      Object.entries(_args || {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value.toString());
        }
      });

      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }

      const data = await run({
        ...input,
        inputSchema: z.any(),
        url,
        token,
        method: "GET",
        runName: "findMany",
      });

      return data;
    },
    deleteMany: async <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(args: {
      args: RunArgs<T, U>;
      /** baseListUrl is required if you set type to "loop" */
      baseListUrl?: string;
      ids?: { id: string }[];
      extraSchema?: z.ZodTypeAny;
    }) => {
      let { args: input, ids, baseListUrl, extraSchema } = args;

      const token = input.token || (await main.token());

      // if (!ids?.length) throw new Error("ids are required");
      if (!baseListUrl) throw new Error("baseListUrl is required");
      if (!extraSchema) extraSchema = z.any();

      const promises = [];

      for (const { id } of ids) {
        promises.push(
          run({
            ...input,
            outputSchema: extraSchema,
            // we will override the input
            url: `${baseListUrl}/${id}`,
            token,
            method: "DELETE",
            noLogger: true,
          })
        );
      }

      const data = await Promise.all(promises);

      // have to validate because we're forcing the types on return
      const parsedResponse = input.outputSchema.parse(data);

      return parsedResponse as z.infer<typeof input.outputSchema>;
    },
    run,
  };
};

type Base = ReturnType<typeof base>;

export { base };
export type { Base };
