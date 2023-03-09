import { HttpMethod } from "../types";

type FetcherOptions = {
  method: HttpMethod;
  token: string;
  args: any;
  url: string;
};
const fetcher = ({ method, token, args, url }: FetcherOptions) => {
  let options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  if (method.match(/POST|PUT|PATCH/g)) {
    const hasInput = "input" in args;
    if ("url" in args) url = args.url;

    options = {
      ...options,
      body: JSON.stringify(hasInput ? args.input : args),
    };
  }

  return fetch(url, options);
};

export default fetcher;
export { fetcher };
