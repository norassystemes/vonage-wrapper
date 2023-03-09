import { z } from "zod";
import { Main } from "../main";
import { Member } from "../schema/member";
import { base } from "./base";

const member = (main: Main) => {
  const name = "member";
  const model = base(main, name);

  const baseUrl = (id: string) => `/v0.3/conversations/${id}/members`;

  const methods = {
    create: async (
      args: {
        conversationId: string;
        input?: z.input<typeof Member.Create>["input"];
      },
      token?: string
    ) => {
      const { input = {}, conversationId } = args;

      return await model.create({
        inputSchema: Member.Create,
        outputSchema: Member.CreateResponse,
        input,
        token,
        url: baseUrl(conversationId),
      });
    },
    update: async (
      args: {
        /** member id */
        id: string;
        conversationId: string;
        input?: z.input<typeof Member.Update>["input"];
      },
      token?: string
    ) => {
      let { id, conversationId, input = {} } = args;
      const url = `${baseUrl(conversationId)}/${id}`;

      return await model.update({
        inputSchema: Member.Update,
        outputSchema: Member.UpdateResponse,
        input,
        token,
        method: "PATCH",
        url,
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
        outputSchema: Member.GetResponse,
        token,
        url,
      });
    },
    findMany: async (args: {
      conversationId: string;
      args?: z.input<typeof Member.Gets>;
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
            inputSchema: disableInput ? z.any() : Member.Gets,
            outputSchema: Member.GetsResponse,
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
          extraSchema: Member.GetResponse,
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
    createMany: async (
      conversationId: string,
      args?: z.input<typeof Member.Create>["input"][],
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
    updateMany: async (
      conversationId: string,
      args: {
        id: string;
        input?: z.input<typeof Member.Update>["input"];
      }[],
      token?: string
    ) => {
      if (typeof args === "undefined") args = [];
      const _token = token || (await main.token());

      const promises = [];

      for (const arg of args) {
        promises.push(
          methods.update(
            {
              conversationId,
              id: arg.id,
              input: arg.input,
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
type Member = ReturnType<typeof member>;

export { member };
export type { Member };
