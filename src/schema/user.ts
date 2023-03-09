import { z } from "zod";
import { User as _User, VonageListResponse } from "./shared";

const Create = z.object({
  url: z.string().url(),
  input: _User.omit({
    id: true,
    /** Vonage override it anyway */
    name: true,
  }),
});
const CreateResponse = _User;

const Update = z.object({
  url: z.string().url(),
  input: _User
    .omit({
      id: true,
    })
    .partial(),
});
const UpdateResponse = _User;

const GetResponse = _User;

const Gets = z.object({
  page_size: z.number().min(1).max(100).default(10),
  order: z.enum(["asc", "desc", "ASC", "DESC"]).default("asc"),
  cursor: z.string().optional(),
});
const GetsResponse = VonageListResponse("users", _User);

const User = {
  Create,
  CreateResponse,
  Update,
  UpdateResponse,
  GetResponse,
  Gets,
  GetsResponse,
};

export { User };
