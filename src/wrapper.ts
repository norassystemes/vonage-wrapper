import type { MainArgsInput, MainOptions } from "./main";
import { main as entry } from "./main";
import allModels from "./models";

const wrapper = (args: MainArgsInput, options?: MainOptions) => {
  const main = entry(args, options);
  const models = allModels(main);

  return {
    client: main.vonage.client,
    auth: main.vonage.auth,
    ...models,
    /**
     * @description This method will delete following from your account:
     *  - all users
     *  - all conversations
     *  - all legs
     *
     * @warning This is a dangerous operation, please make sure you want to do it.
     */
    deleteAllResources: async (
      /** set to 'sure-i-mean-it' to wipe out everything */
      sureYouMeanIt?: string,
      token?: string
    ) => {
      if (sureYouMeanIt !== "sure-i-mean-it") {
        throw new Error(`
              You need to pass 'sure-i-mean-it' to the method to wipe out everything, 
              after being sure you want to do it of course ✌️.
            `);
      }

      const _token = token || (await main.token());

      const deletedUsers = await models.user.deleteMany(
        undefined,
        "sure",
        _token
      );

      const deletedConversations = await models.conversation.deleteMany(
        undefined,
        "sure",
        _token
      );

      const deletedLegs = await models.leg.deleteMany(
        undefined,
        "sure",
        _token
      );

      return {
        users: deletedUsers,
        conversations: deletedConversations,
        legs: deletedLegs,
      };
    },
  };
};

export default wrapper;
export { wrapper };

const test = async () => {
  const _ = wrapper({});

  _.user.session.findMany({
    userId: "123",
  });
};
