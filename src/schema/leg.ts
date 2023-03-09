import dayjs from "dayjs";
import { z } from "zod";
import { VonageListResponse, VonageNumber } from "./shared";

const _Leg = z.object({
  uuid: z.string(),
  type: z.enum(["app", "phone", "sip", "websocket", "vbc"]),
  conversation_uuid: z.string().optional(),
  from: VonageNumber,
  to: VonageNumber,
  start_time: z.string().transform((value) => new Date(value)),
  end_time: z.string().transform((value) => new Date(value)),
});

const LegResponse = _Leg.merge(
  z.object({
    /** ---> maybe deprecated */
    state: z.enum(["terminated"]).optional(),
    /** <--- */

    _links: z.object({
      first: z.object({
        href: z.string(),
      }),
      self: z.object({
        href: z.string(),
      }),
      next: z
        .object({
          href: z.string(),
        })
        .optional(),
      prev: z
        .object({
          href: z.string(),
        })
        .optional(),
    }),
    _embedded: z.any(),
    /** Undocumented */
    status: z.string().optional(),
    rtc: z
      .object({
        /** serves as an id for the `leg` */
        id: z.string().optional(),
        session_id: z.string().optional(),
        state: z.enum(["terminated"]).optional(),
      })
      .optional(),
  })
);

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
const GetsResponse = VonageListResponse("legs", LegResponse);

const Leg = {
  Gets,
  GetsResponse,
};

export { Leg };
