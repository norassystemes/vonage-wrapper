# ⚡ Vonage Wrapper

1. This is a simple wrapper around the official [Vonage Server SDK](https://github.com/Vonage/vonage-node-sdk/tree/3.x/packages/server-sdk)
2. Conversation API methods are supported

## Installation

```cli
pnpm add vonage-wrapper
```

```cli
npm i vonage-wrapper
```

```cli
yarn add vonage-wrapper
```

## Usage

### Initialize

```ts
import { vonage } from "vonage-wrapper";

const {} = vonage(
  {
    applicationId: "...",
    privateKey: "...",
  },
  options
);
```

### Logger

You can pass your own logger

```ts
const options = {
  logger: (level: Level, message: string, details: object) => void
}
type Level = "error" | "fatal" | "warn" | "info" | "debug" | "trace";

...
```

Or use the default logger

```ts
const options = {
  logger: true
}

...
```

The wrapper takes the same type of arguments that `@vonage/server-sdk` takes.

```ts
const {} = vonage(
  {
    auth: {}, // `@vonage/auth` new Vonage(<...>) arguments
    client: {}, // `@vonage/server-sdk` new Auth(<...>) arguments

    baseUrl: "", // in case you want to use a different vonage server
  },
  options
);
```

### Supported Models

- Conversation
  - Member
  - Event
- User
  - Session
  - Conversation
- Leg

"Only allowed methods were implemented, with a small tweak and defaults"

every supported model has some of the following methods:

```ts
// create a single resource
create(...): Promise<...>;

// create multiple resources
createMany(...): Promise<...>;

// get a single resource
find(...): Promise<...>;

// get multiple resources
findMany(...): Promise<...>;

// update a single resource
update(...): Promise<...>;

// update multiple resources
updateMany(...): Promise<...>;

// delete a single resource
delete(...): Promise<...>;

// delete multiple resources
deleteMany(...): Promise<...>;
```

Every supported model returns a method called `run(...)` that abstract the API call with validation on the request input and response output in a context of that model and current instance of `vonage(...)`.

you need to pass [`zod`](https://github.com/colinhacks/zod) schema for the input and output though.

```ts
const customCreate = async (url: string, args: unknown) => {
  // do something with the url and args

  return await conversation.run({
    inputSchema, // set to `z.any()` if you don't want to validate
    outputSchema, // set to `z.any()` if you don't want to validate,
    method: "POST", // or any other HTTP method that vonage allows
    input: args,
    runName: "customCreate", // used for logging, default to "unknown"
    /**
        `url`: string; you can pass a relative url "Ex: /v0.3/conversations", if you do so, the base url will be added automatically, or you can pass a full url "Ex: https://api.nexmo.com/v0.3/conversations"
    */
    url: url,
    token: "", // if you want to pass the token yourself
  });
};

// A little better version of
/**
const customCreate = await fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: token,
    },
    body: JSON.stringify(args)
})
*/

// `customCreate`: z.infer<typeof outputSchema>

interface RunArgs {
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  url: string;
  input?: unknown;
  method?: HttpMethod;
  runName?: string;
  token?: string;
}
```

## Examples

- Access nested models

```ts
const data = await conversation.member.findMany();
```

- Provide token for 'Authorization' header yourself

```ts
const { getToken, conversation } = vonage(...);

// You can cache the token or do whatever you want
const token = await getToken();

const data = await conversation.find(..., token);
```

- Use the original Vonage client and Auth instances

```ts
const { client, auth } = vonage(...);

const newMessage = await client.sms.send({...});

// `newMessage`: SendSMSResponse type coming from @vonage/server-sdk


const hash = await auth.createSignatureHash({...});

// `hash`: AuthSignedParams type coming from @vonage/auth
```
