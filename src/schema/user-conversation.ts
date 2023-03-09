import { MemberResponse, VonageListResponse } from "./shared";

const GetsResponse = VonageListResponse("members", MemberResponse);

const UserConversation = {
  GetsResponse,
};

export { UserConversation };
