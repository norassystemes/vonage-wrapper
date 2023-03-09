import { Vonage } from "@vonage/server-sdk";
import { AlgorithmTypes, Auth } from "@vonage/auth";
import { z } from "zod";
import { validate } from "./utils";

// @vonage/server-sdk@3.1.1
enum ResponseTypes {
  json = "json",
}
// ts error: Exported variable 'x' has or is using name 'ResponseTypes' from external module
export { ResponseTypes };

const Signature = z.object({
  secret: z.string(),
  algorithm: z
    .enum(["MD5HASH", "MD5HMAC", "SHA1HMAC", "SHA256HMAC", "SHA512HMAC"])
    .transform((value) => value as AlgorithmTypes),
});

const AuthOptions = z.object({
  /** parameter of a new Auth(<...>) instance */
  apiKey: z.string().optional(),
  /** parameter of a new Auth(<...>) instance */
  apiSecret: z.string().optional(),
  /** parameter of a new Auth(<...>) instance */
  applicationId: z.string().optional(),
  /** parameter of a new Auth(<...>) instance */
  privateKey: z.string().or(z.custom<Buffer>()).optional(),
  /** parameter of a new Auth(<...>) instance */
  signature: Signature.optional(),
});
const VonageOptions = z
  .object({
    /** parameter of a new Vonage(<...>) instance */
    timeout: z.number(),
    /** parameter of a new Vonage(<...>) instance */
    restHost: z.string(),
    /** parameter of a new Vonage(<...>) instance */
    apiHost: z.string(),
    /** parameter of a new Vonage(<...>) instance */
    videoHost: z.string(),
    /** parameter of a new Vonage(<...>) instance */
    responseType: z.enum(["json"]).transform((value) => value as ResponseTypes),
  })
  .optional();
const Options = AuthOptions.and(VonageOptions);

const client = (options?: Partial<z.input<typeof Options>>) => {
  const authOptions = validate(AuthOptions, options);
  const clientOptions = validate(z.any(), options);
  //                       TODO: ^^^^^^^ type this

  const auth = new Auth(authOptions);
  const vonage = new Vonage(auth);

  return {
    auth,
    client: vonage,
  };
};

export { AuthOptions, VonageOptions, Options as ClientOptions, client };
