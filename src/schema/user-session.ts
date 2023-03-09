import { Session, VonageListResponse } from "./shared";

const GetsResponse = VonageListResponse("sessions", Session);

const UserSession = {
  GetsResponse,
};

export { UserSession };
