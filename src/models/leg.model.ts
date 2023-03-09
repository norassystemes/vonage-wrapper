import { z } from "zod";
import { Main } from "../main";
import { Leg } from "../schema/leg";
import { base } from "./base";

const leg = (main: Main) => {
  const name = "leg";
  const model = base(main, name);

  const baseUrl = `/v0.3/legs`;

  const methods = {
    delete: async (
      args: {
        id: string;
      },
      token?: string
    ) => {
      let { id } = args;
      const url = `${baseUrl}/${id}`;

      return await model.delete({
        inputSchema: z.any(),
        outputSchema: z.any(),
        token,
        url,
      });
    },
    findMany: async (args?: {
      args?: z.input<typeof Leg.Gets>;
      /** ids to fetch */
      ids?: {
        id: string;
      }[];
      /** A paginated url coming in the api response `next.href` */
      paginated?: string;
      /**
       * if you exceeded 10,000 items per fetch we will return the
       * 10,000 items and give you back the url coming from the api
       * to start call next time
       * */
      limitless?: boolean;
      token?: string;
    }) => {
      let {
        args: input,
        ids = [],
        paginated,
        limitless = false,
        token,
      } = args || {};
      if (typeof input === "undefined") input = {};
      const providedArgs = Object.keys(input).length > 1 || paginated;

      // logs
      if (ids.length && providedArgs) {
        main.logger(
          "warn",
          "🔥 You have set `ids`, so the other arguments will be ignored.",
          {
            ignored: {
              args: input,
              paginated,
            },
          }
        );
      }
      if (limitless && Object.keys(input).length > 1) {
        main.logger(
          "warn",
          "🔥 You have set `limitless: true`, so the other arguments will be ignored.",
          {
            ignored: {
              args: input,
            },
          }
        );
      }

      const helper = (args: {
        url?: string;
        type?: "limitless" | "cursor" | "loop";
        noInput?: boolean;
        /** a string to be used as baseListUrl */
        noUrl?: string;
        withIds?: { id: string }[];
        extraSchema?: z.ZodTypeAny;
        disableInput?: boolean;
      }) => {
        const {
          url,
          type,
          noInput = false,
          noUrl,
          withIds,
          extraSchema,
          disableInput = false,
        } = args;

        return model.findMany({
          type: type,
          args: {
            inputSchema: disableInput ? z.any() : Leg.Gets,
            outputSchema: Leg.GetsResponse,
            input: noInput ? undefined : input,
            token,
            url: url ? url : noUrl ? "" : baseUrl,
          },
          baseListUrl: noUrl ? noUrl : undefined,
          ids: withIds ? withIds : undefined,
          extraSchema: extraSchema,
        });
      };

      // ⚠️ `limitless` is true
      if (limitless) {
        const url = paginated || baseUrl;

        return await helper({
          type: "limitless",
          url,
        });
      }

      // ⚡ the user had provided ids
      if (ids.length) {
        return await helper({
          type: "loop",
          withIds: ids,
          noUrl: baseUrl,
          noInput: true,
          extraSchema: z.any(),
        });
      }

      // ⚡ the user had provided a paginated url
      if (paginated) {
        return await helper({
          type: "cursor",
          url: paginated,
          disableInput: true,
        });
      }

      // ⚡ the user wants the native pagination
      return await helper({
        url: baseUrl,
      });
    },
    /**
     *
     * @note if one of the legs fails to delete, the process will stop
     * and throw an error the successful deletions will not be rolled back
     * @note this may take a while so make sure you extend your connection timeout
     * if you want to use it extensively
     *
     * @warning if you don't provide `ids`, all legs will be deleted
     *
     * @description deletes provided legs or all legs if no `ids`
     * are provided
     */
    deleteMany: async (
      ids?: {
        id: string;
      }[],
      /** You must set this to 'sure' if you want to delete all legs in your account */
      sure?: string,
      token?: string
    ) => {
      if (typeof sure === "undefined") sure = "not_sure 😅";
      const tooMuch = 700;
      const dangerous = !ids?.length;
      const _token = token || (await main.token());

      if (dangerous) {
        if (sure !== "sure") {
          throw new Error(
            `💀
                  🔥 This is a dangerous operation.
                  You may want to delete all legs, but you didn't provide the 'sure' argument.
                  If you are sure you want to delete all legs, please provide "sure: 'sure'" as
                  the second argument.`
          );
        }
        main.logger("warn", "🔥 You are deleting all the legs of yours.");

        const items = await methods.findMany({
          limitless: true,
          token: _token,
        });

        const ids = items._embedded.legs.map((item) => {
          return { id: item.uuid };
        });

        if (ids.length > tooMuch) {
          throw new Error(
            `💀
                  🔥 You are trying to delete ${ids.length} legs.
                  This is too much, please use the ids argument to delete a smaller number of legs.`
          );
        }

        return await model.deleteMany({
          args: {
            inputSchema: z.any(),
            outputSchema: z.any(),
            url: "",
            token: _token,
          },
          baseListUrl: baseUrl,
          ids,
        });
      }

      return await model.deleteMany({
        args: {
          inputSchema: z.any(),
          outputSchema: z.any(),
          url: "",
          token: _token,
        },
        baseListUrl: baseUrl,
        ids,
      });
    },
    run: model.run,
  };

  return methods;
};
type Leg = ReturnType<typeof leg>;

export { leg };
export type { Leg };
