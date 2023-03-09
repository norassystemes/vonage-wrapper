import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import { z } from "zod";
import { client, AuthOptions, VonageOptions } from "./client";
import { Promisable } from "./types";
import { build, method } from "./utils";
import log, { Logger } from "./utils/log";

const BASE_URL = "https://api.nexmo.com";

const _AuthOptions = z
  .object({
    auth: z.never().optional(),
  })
  .and(AuthOptions)
  .or(
    z.object({
      auth: AuthOptions,
      apiKey: z.never().optional(),
      apiSecret: z.never().optional(),
      applicationId: z.never().optional(),
      privateKey: z.never().optional(),
      signature: z.never().optional(),
    })
  );

const _VonageOptions = z
  .object({
    client: z.never().optional(),
  })
  .and(VonageOptions)
  .or(
    z.object({
      client: VonageOptions,
      timeout: z.never().optional(),
      restHost: z.never().optional(),
      apiHost: z.never().optional(),
      videoHost: z.never().optional(),
      responseType: z.never().optional(),
    })
  );

const Args = _AuthOptions.and(_VonageOptions).and(
  z.object({
    baseUrl: z.string().default(BASE_URL),
  })
);

type MainArgsInput = z.input<typeof Args>;

const extractArgs = <T extends MainArgsInput>(
  args: T,
  callback?: (data?: z.infer<typeof Args>, err?: Error) => Promisable<void>
) => {
  if (typeof callback === "undefined") callback = () => {};

  try {
    const data = Args.parse(args);

    callback?.(data);

    return {
      apiKey: data.auth?.apiKey || data.apiKey,
      apiSecret: data.auth?.apiSecret || data.apiSecret,
      applicationId: data.auth?.applicationId || data.applicationId,
      privateKey: data.auth?.privateKey || data.privateKey,
      signature: data.auth?.signature || data.signature,
      timeout: data.client?.timeout || data.timeout,
      restHost: data.client?.restHost || data.restHost,
      apiHost: data.client?.apiHost || data.apiHost,
      videoHost: data.client?.videoHost || data.videoHost,
      responseType: data.client?.responseType || data.responseType,
      baseUrl: data.baseUrl,
    };
  } catch (err) {
    callback?.(undefined, err as Error);

    throw err;
  }
};

type MainOptions = {
  logger?: true | Logger;
};

const main = (args: MainArgsInput, options?: MainOptions) => {
  const _args = extractArgs(args);

  if (typeof options === "undefined") options = {};
  if (typeof options?.logger === "undefined") options.logger = () => {};
  const logger = options?.logger === true ? log : options?.logger;

  const vonage = client(_args);

  const token = async () =>
    await method(() => vonage.auth.createBearerHeader(), {
      logger,
      name: "token",
    });

  /**
   * sets up a builder in context of this `main` instance
   */
  const builder = build(_args.baseUrl, token, { logger });

  return {
    token,
    builder,
    vonage,
    logger,
    baseUrl: _args.baseUrl,
  };
};
type Main = ReturnType<typeof main>;

export { main };
export type { Main, MainOptions, MainArgsInput };
