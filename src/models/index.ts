import { Main } from "../main";
import { conversation as conversationModel } from "./conversation.model";
import { leg as legModel } from "./leg.model";
import { user as userModel } from "./user.model";

const models = (main: Main) => {
  const conversation = conversationModel(main);
  const user = userModel(main);
  const leg = legModel(main);

  return {
    conversation,
    user,
    leg,
  };
};
type Models = ReturnType<typeof models>;

export default models;
export type { Models };
