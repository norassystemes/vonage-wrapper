import { z } from "zod";
import { vonage } from ".";

const key = ``;
const test = async () => {
  const wrapper = vonage(
    {
      applicationId: "1799f7a8-f0e7-4603-a359-05b9be1fa1f5",
      privateKey: key,
    },
    { logger: true }
  );

  // const t = await wrapper.auth.createBearerHeader();
  // const t = await wrapper.conversation.create();
  // const t = await wrapper.conversation.createMany([{}, {}]);
  // const t = await wrapper.conversation.deleteMany(undefined, "sure");
  // const t = await wrapper.conversation.findMany();

  const t = await wrapper.user.create({
    name: "test_user_name",
  });

  console.log(t);
};

test();
