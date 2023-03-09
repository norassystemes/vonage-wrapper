import { z } from "zod";
import { Main } from "../main";
import { Conversation } from "../schema/conversation";
import { base } from "./base";
import { event } from "./event.model";
import { member } from "./member.model";

const conversation = (main: Main) => {
  const name = "conversation";
  const model = base(main, name);

  const baseUrl = "/v0.3/conversations";

  const methods = {
    create: async (
      args?: z.input<typeof Conversation.Create>["input"],
      token?: string
    ) => {
      if (typeof args === "undefined") args = {};

      return await model.create({
        inputSchema: Conversation.Create,
        outputSchema: Conversation.CreateResponse,
        input: args,
        token,
        url: baseUrl,
      });
    },
    update: async (
      args: {
        id: string;
        input?: z.input<typeof Conversation.Update>["input"];
      },
      token?: string
    ) => {
      let { id, input = {} } = args;
      const url = `${baseUrl}/${id}`;

      return await model.update({
        inputSchema: Conversation.Update,
        outputSchema: Conversation.UpdateResponse,
        input,
        token,
        url,
      });
    },
    find: async (
      args: {
        id: string;
      },
      token?: string
    ) => {
      let { id } = args;
      const url = `${baseUrl}/${id}`;

      return await model.find({
        inputSchema: z.any(),
        outputSchema: Conversation.GetResponse,
        token,
        url,
      });
    },
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
      args?: z.input<typeof Conversation.Gets>;
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
            inputSchema: disableInput ? z.any() : Conversation.Gets,
            outputSchema: Conversation.GetsResponse,
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
          extraSchema: Conversation.GetResponse,
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
     * @note if one of the conversations fails to delete, the process will stop
     * and throw an error the successful deletions will not be rolled back
     * @note this may take a while so make sure you extend your connection timeout
     * if you want to use it extensively
     *
     * @warning if you don't provide `ids`, all conversations will be deleted
     *
     * @description deletes provided conversations or all conversations if no `ids`
     * are provided
     */
    deleteMany: async (
      ids?: {
        id: string;
      }[],
      /** You must set this to 'sure' if you want to delete all conversations in your account */
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
                  You may want to delete all conversations, but you didn't provide the 'sure' argument.
                  If you are sure you want to delete all conversations, please provide "sure: 'sure'" as
                  the second argument.`
          );
        }
        main.logger(
          "warn",
          "🔥 You are deleting all the conversations of yours."
        );

        const items = await methods.findMany({
          limitless: true,
          token: _token,
        });

        const ids = items._embedded.conversations.map((item) => {
          return { id: item.id };
        });

        if (ids.length > tooMuch) {
          throw new Error(
            `💀
                  🔥 You are trying to delete ${ids.length} conversations.
                  This is too much, please use the ids argument to delete a smaller number of conversations.`
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
    createMany: async (
      args?: z.input<typeof Conversation.Create>["input"][],
      token?: string
    ) => {
      if (typeof args === "undefined") args = [];
      const _token = token || (await main.token());

      const promises = [];

      for (const arg of args) {
        promises.push(methods.create(arg, _token));
      }

      return await Promise.all(promises);
    },
    updateMany: async (
      args: {
        id: string;
        input?: z.input<typeof Conversation.Update>["input"];
      }[],
      token?: string
    ) => {
      if (typeof args === "undefined") args = [];
      const _token = token || (await main.token());

      const promises = [];

      for (const arg of args) {
        promises.push(methods.update(arg, _token));
      }

      return await Promise.all(promises);
    },
    member: {
      ...member(main),
    },
    event: {
      ...event(main),
    },
    run: model.run,
  };

  return methods;
};
type Conversation = ReturnType<typeof conversation>;

export { conversation };
export type { Conversation };
