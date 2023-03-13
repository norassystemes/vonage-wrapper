import dayjs from "dayjs";
import { z } from "zod";

const VonageListResponse = <K extends string, T extends z.ZodTypeAny>(
  key: K,
  schema: T
) =>
  z
    .object({
      page_size: z.number(),
      _embedded: z.object({
        // [key in VonageLists]: z.array(schema),
        // to return a typed [key]: schema[]
        [key]: z.array(schema).default([]),
      }),
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
    })
    .superRefine((val, ctx) => {
      // type guard to check if the 'key' we provided
      // is coming from the api
      if (key in val._embedded) return true;
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `key ${key} is not in the _embedded object`,
      });
    })
    .transform((val) => ({
      ...val,
      _embedded: {
        [`${key}`]: val._embedded[key],
      } as { [key in K]: z.infer<T>[] },
    }));

const VonageNumber = z
  .object({
    type: z.enum(["phone", "sip", "app", "websocket", "vbc"]).default("phone"),
    number: z
      .number()
      .transform((v) => String(v))
      .optional(),
    uri: z.string().url().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    user: z.string().optional(),
    content_type: z.string().optional(),
    extension: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "phone" && !val.number)
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "number is required for type phone",
      });
    if (val.type === "sip" && (!val.uri || !val.username || !val.password))
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "missing params is required for type sip",
      });
    if (val.type === "app" && !val.user)
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "user is required for type app",
      });
    if (val.type === "vbc" && !val.extension)
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "extension is required for type vbc",
      });
  });

const Conversation = z.object({
  /**
   * The unique identifier for this conversation
   * Example: CON-d66d47de-5bcb-4300-94f0-0c9d4b948e9a
   */
  id: z.string(),
  /**
   * Your internal conversation name. Must be unique
   * Example: customer_chat
   */
  name: z.string().optional(),
  /**
   * The public facing name of the conversation
   * Example: Customer Chat
   */
  display_name: z.string().optional(),
  image_url: z.string().optional(),
  timestamp: z.object({
    created: z
      .string()
      .or(z.any()) // we're interfering the parsing somewhere in the app
      .transform((value) => dayjs(value).toDate()),
    updated: z
      .string()
      .transform((value) => dayjs(value).toDate())
      .optional(),
    destroyed: z
      .string()
      .transform((value) => dayjs(value).toDate())
      .optional(),
  }),
  _links: z
    .object({
      self: z.object({
        href: z.string(),
      }),
    })
    .optional(),
  properties: z
    .object({
      ttl: z.number().optional(),
      type: z.string().optional(),
      custom_data: z.object({}).or(z.any()).optional(),
    })
    .optional(),
  numbers: z.array(VonageNumber).optional(),
  state: z.enum(["ACTIVE"]).optional(),
  sequence_number: z.number().optional(),
});

const FlexibleNumberParser = z.unknown().transform((v) => {
  if (typeof v === "number") return String(v);

  // check for NaN
  if (isNaN(Number(v))) throw new Error("Invalid number");

  return v;
});

const User = z.object({
  id: z.string(),
  /**
   * Unique name for a user
   * Example: my_user_name
   */
  name: z.string().optional(),
  /**
   * A string to be displayed as user name. It does not need to be unique
   * Example: My User Name
   */
  display_name: z.string().optional(),
  image_url: z.string().optional(),
  channels: z
    .object({
      pstn: z.array(z.any()).optional(),
      sip: z.array(z.any()).optional(),
      vbc: z.array(z.any()).optional(),
      websocket: z.array(z.any()).optional(),
      // sms: z.array(z.number().transform((v) => String(v))).optional(),
      // mms: z.array(z.number().transform((v) => String(v))).optional(),
      // whatsapp: z.array(z.number().transform((v) => String(v))).optional(),
      // viber: z.array(z.number().transform((v) => String(v))).optional(),
      // messenger: z.array(z.number().transform((v) => String(v))).optional(),

      sms: z
        .array(
          z.object({
            number: FlexibleNumberParser,
          })
        )
        .optional(),
      mms: z
        .array(
          z.object({
            number: FlexibleNumberParser,
          })
        )
        .optional(),
      whatsapp: z
        .array(
          z.object({
            number: FlexibleNumberParser,
          })
        )
        .optional(),
      viber: z
        .array(
          z.object({
            number: FlexibleNumberParser,
          })
        )
        .optional(),
      messenger: z
        .array(
          z.object({
            id: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  _links: z
    .object({
      self: z.object({
        href: z.string(),
      }),
    })
    .optional(),
  properties: z
    .object({
      ttl: z.number().optional(),
      type: z.string().optional(),
      custom_data: z.object({}).or(z.any()).optional(),
    })
    .optional(),
});
const Session = z.object({
  id: z.string(),
  _embedded: z.object({
    user: User,
    api_key: z.string().optional(),
  }),
  properties: z.object({
    ttl: z.number().optional(),
  }),
  _links: z.object({
    self: z.object({
      first: z
        .object({
          href: z.string(),
        })
        .optional(),
      self: z
        .object({
          href: z.string(),
        })
        .optional(),
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
  }),
});
const Channel = z.object({
  type: z.enum(["app", "phone", "sip", "websocket", "vbc"]),
  /**
   * The id of the leg. rtc_id and call_id are leg id
   * Example: a5959595959595959595959
   */
  leg_id: z.string().optional(),
  from: VonageNumber.optional(),
  to: VonageNumber.optional(),
  leg_ids: z
    .array(
      z.object({
        leg_id: z.string(),
      })
    )
    .optional(),
});
const Member = z.object({
  state: z.enum([
    "JOINED",
    "INVITED",
    "LEFT",
    "UNKNOWN",
    "joined",
    "invited",
    "left",
    "unknown",
  ]),
  user: User.pick({
    id: true,
    name: true,
  })
    .partial()
    .refine((value) => !!value.id || !!value.name, {
      message: "Either id or name must be provided",
    }),
  channel: Channel,
  /** Media Object???? I think it's kinda typeof `File` */
  media: z.any().optional(),
  /**
   * Knocker ID. A knocker is a pre-member of a conversation who does not exist yet
   * Example: a972836a-450f-35fa-156c-52a2ab5b7d25
   */
  knocking_id: z.string().optional(),
  /**
   * Member ID of the member that sends the invitation
   * Example: MEM-63f61863-4a51-4f6b-86e1-46edebio0391
   */
  member_id_inviting: z.string().optional(),
});
const MemberResponse = z
  .object({
    id: z.string(),
    _embedded: z.object({
      user: User.pick({
        id: true,
        name: true,
        display_name: true,
        _links: true,
      }).partial(),
    }),
    // the list response doesn't retrieve this
    timestamp: z
      .object({
        invited: z
          .string()
          .transform((v) => new Date(v))
          .optional(),

        joined: z
          .string()
          .transform((v) => new Date(v))
          .optional(),

        left: z.string().transform((v) => new Date(v)),
      })
      .optional(),
    initiator: z
      .object({
        joined: z.object({
          /**
           * true if the user was invited by an admin JWT. user_id and member_id will not exist if true
           */
          isSystem: z
            .any()
            .transform((v) => Boolean(v))
            .optional(),
          user_id: z.string().optional(),
          member_id: z.string().optional(),
        }),
      })
      .optional(),
    _links: z
      .object({
        href: z.string(),
      })
      .optional(),
  })
  .merge(
    Member.partial().omit({
      user: true,
      knocking_id: true,
      member_id_inviting: true,
    })
  );

export {
  User,
  Session,
  Channel,
  Member,
  MemberResponse,
  Conversation,
  VonageNumber,
  VonageListResponse,
};
