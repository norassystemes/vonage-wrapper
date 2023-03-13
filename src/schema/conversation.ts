import dayjs from "dayjs";
import { z } from "zod";
import { Conversation as _Conversation, VonageListResponse } from "./shared";

const Create = z.object({
  url: z.string().url(),
  input: z
    .object({
      callback: z
        .object({
          url: z.string().url(),
          event_mask: z.string().optional(),
          params: z
            .object({
              applicationId: z.string().optional(),
              ncco_url: z.string().url().optional(),
            })
            .optional(),
          method: z.enum(["POST", "GET"]).optional(),
        })
        .optional(),
    })
    .merge(
      _Conversation.omit({
        id: true,
        /** Vonage override it anyway */
        // name: true,
        timestamp: true,
        sequence_number: true,
        state: true,
      })
    ),
});
const CreateResponse = _Conversation;

const Update = z.object({
  url: z.string().url(),
  input: z
    .object({
      callback: z
        .object({
          url: z.string().url(),
          event_mask: z.string().optional(),
          params: z
            .object({
              applicationId: z.string().optional(),
              ncco_url: z.string().url().optional(),
            })
            .optional(),
          method: z.enum(["POST", "GET"]).optional(),
        })
        .optional(),
    })
    .merge(
      _Conversation
        .omit({
          sequence_number: true,
          state: true,
          timestamp: true,
          id: true,
        })
        .partial()
    ),
});
const UpdateResponse = _Conversation;

const GetResponse = _Conversation;

export { GetResponse };

const Gets = z.object({
  /**
   * Return the records that occurred after this point in time.
   */
  date_start: z
    .date()
    .transform((value) => dayjs(value).format("YYYY-MM-DD HH:mm:ss").toString())
    .optional(),
  /**
   * Return the records that occurred before this point in time.
   */
  date_end: z
    .date()
    .transform((value) => dayjs(value).format("YYYY-MM-DD HH:mm:ss").toString())
    .optional(),
  /**
   * Return this amount of records in the response
   */
  page_size: z.number().min(1).max(100).default(10),
  /**
   * Return the records in ascending or descending order.
   */
  order: z.enum(["asc", "desc", "ASC", "DESC"]).default("asc"),
  /**
   * The cursor to start returning results from.
   * You are not expected to provide this manually, but to follow the url provided in `_links.next.href` or `_links.prev.href` in the response which contains a cursor value.
   */
  cursor: z.string().optional(),
});
const GetsResponse = VonageListResponse("conversations", _Conversation);

const Conversation = {
  Create,
  CreateResponse,
  Update,
  UpdateResponse,
  GetResponse,
  Gets,
  GetsResponse,
};

export { Conversation };
