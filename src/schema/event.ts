import dayjs from "dayjs";
import { z } from "zod";
import { VonageListResponse } from "./shared";

const _Event = z.object({
  type: z.enum(["text"]),
  to: z.string().optional(),
  from: z.string(),
  body: z.string().optional(),
});

const EventResponse = _Event.merge(
  z.object({
    id: z.string(),
    state: z
      .enum([
        "INVITED",
        "JOINED",
        "LEFT",
        "UNKNOWN",
        "joined",
        "left",
        "invited",
        "unknown",
      ])
      .optional(),
    timestamp: z.string().transform((value) => new Date(value)),
    href: z.string().url(),
  })
);

const Create = z.object({
  url: z.string().url(),
  input: _Event,
});
const CreateResponse = EventResponse;

const GetResponse = EventResponse;

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
const GetsResponse = VonageListResponse("events", EventResponse);

const Event = {
  Create,
  CreateResponse,
  GetResponse,
  Gets,
  GetsResponse,
};

export { Event };
