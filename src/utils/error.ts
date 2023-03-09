function generateError(err: any) {
  if (err instanceof Error) {
    return err;
  }

  if (typeof err === "string") {
    return new Error(err);
  }

  // vonage errors
  if ("detail" in err) {
    const error = `Vonage Error: ${err.title} | ${err.code} | ${err.detail}`;
    return new Error(error);
  }

  return new Error(err);
}
export { generateError };
