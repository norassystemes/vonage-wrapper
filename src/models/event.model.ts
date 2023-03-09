import { z } from "zod";
import { Main } from "../main";
import { Event } from "../schema/event";
import { base } from "./base";

const event = (main: Main) => {
  const name = "event";
  const model = base(main, name);

  const baseUrl = (id: string) => `/v0.3/conversations/${id}/events`;

  const methods = {
    create: async (
      args: {
        conversationId: string;
        input?: z.input<typeof Event.Create>["input"];
      },
      token?: string
    ) => {
      const { input = {}, conversationId } = args;

      return await model.create({
        inputSchema: Event.Create,
        outputSchema: Event.CreateResponse,
        input,
        token,
        url: baseUrl(conversationId),
      });
    },
    find: async (
      args: {
        id: string;
        conversationId: string;
      },
      token?: string
    ) => {
      let { id, conversationId } = args;
      const url = `${baseUrl(conversationId)}/${id}`;

      return await model.find({
        inputSchema: z.any(),
        outputSchema: Event.GetResponse,
        token,
        url,
      });
    },
    delete: async (
      args: {
        conversationId: string;
        id: string;
      },
      token?: string
    ) => {
      let { id, conversationId } = args;
      const url = `${baseUrl(conversationId)}/${id}`;

      return await model.delete({
        inputSchema: z.any(),
        outputSchema: z.any(),
        token,
        url,
      });
    },
    findMany: async (args: {
      conversationId: string;
      args?: z.input<typeof Event.Gets>;
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
        conversationId,

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
            inputSchema: disableInput ? z.any() : Event.Gets,
            outputSchema: Event.GetsResponse,
            input: noInput ? undefined : input,
            token,
            url: url ? url : noUrl ? "" : baseUrl(conversationId),
          },
          baseListUrl: noUrl ? noUrl : undefined,
          ids: withIds ? withIds : undefined,
          extraSchema: extraSchema,
        });
      };

      // ⚠️ `limitless` is true
      if (limitless) {
        const url = paginated || baseUrl(conversationId);

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
          noUrl: baseUrl(conversationId),
          noInput: true,
          extraSchema: Event.GetResponse,
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
        url: baseUrl(conversationId),
      });
    },
    /**
     *
     * @note if one of the events fails to delete, the process will stop
     * and throw an error the successful deletions will not be rolled back
     * @note this may take a while so make sure you extend your connection timeout
     * if you want to use it extensively
     *
     * @warning if you don't provide `ids`, all events will be deleted
     *
     * @description deletes provided events or all events if no `ids`
     * are provided
     */
    deleteMany: async (
      conversationId: string,
      ids?: {
        id: string;
      }[],
      /** You must set this to 'sure' if you want to delete all events in your account */
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
                  You may want to delete all events, but you didn't provide the 'sure' argument.
                  If you are sure you want to delete all events, please provide "sure: 'sure'" as
                  the second argument.`
          );
        }
        main.logger("warn", "🔥 You are deleting all the events of yours.");

        const items = await methods.findMany({
          conversationId,
          limitless: true,
          token: _token,
        });

        const ids = items._embedded.events.map((item) => {
          return { id: item.id };
        });

        if (ids.length > tooMuch) {
          throw new Error(
            `💀
                  🔥 You are trying to delete ${ids.length} events.
                  This is too much, please use the ids argument to delete a smaller number of events.`
          );
        }

        return await model.deleteMany({
          args: {
            inputSchema: z.any(),
            outputSchema: z.any(),
            url: "",
            token: _token,
          },
          baseListUrl: baseUrl(conversationId),
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
        baseListUrl: baseUrl(conversationId),
        ids,
      });
    },
    createMany: async (
      conversationId: string,
      args?: z.input<typeof Event.Create>["input"][],
      token?: string
    ) => {
      if (typeof args === "undefined") args = [];
      const _token = token || (await main.token());

      const promises = [];

      for (const arg of args) {
        promises.push(
          methods.create(
            {
              conversationId,
              input: arg,
            },
            _token
          )
        );
      }

      return await Promise.all(promises);
    },
    run: model.run,
  };

  return methods;
};
type Event = ReturnType<typeof event>;

export { event };
export type { Event };
