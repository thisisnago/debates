import { FastifyInstance } from "fastify";
import * as user from "./handlers/user";
import * as auth from "./handlers/auth";
import * as friend from "./handlers/friend";
import * as room from "./handlers/room";
import * as invite from "./handlers/invite";
import { authMiddleware } from "./middleware/authorization";

export async function applicationApi(server: FastifyInstance): Promise<void> {
  server.addHook("onRequest", authMiddleware);

  server.get("/users", user.getUsers);
  server.get("/users/:id", user.getUser);
  server.post("/users", user.createUser);
  server.put("/users/:id", user.updateUser);


  server.get("/invites/:id", invite.getInvite);
  server.post("/invites/send/:userId", invite.sendInvite);
  server.put("/invites/accept/:id", invite.acceptInvite);
  server.put("/invites/reject/:id", invite.rejectInvite);

  server.get("/friends", friend.getFriends);
  server.get("/friends/:id", friend.getFriend);
  server.delete("/friends/:id", friend.deleteFriend);
  server.get("/friends/received-invites", invite.getReceivedFriendInvites);
  server.get("/friends/sent-invites", invite.getSentFriendInvites);

  server.post("/rooms", room.createRoom);
  server.put("/rooms/join/:code", room.joinRoom);
  server.put("/rooms/:id/set-judje/:userId", room.setJudje);
  server.put("/rooms/:id/set-own-team", room.setOwnTeam);
  server.put("/rooms/:id/set-user-team/:userId", room.setUserTeam);
  server.put("/rooms/start/:id", room.startRoom);
  server.put("/rooms/end/:id", room.endRoom);
  server.get("/rooms/received-invites", invite.getReceivedGameInvites);
  server.get("/rooms/sent-invites", invite.getSentGameInvites);
  server.get("/rooms/own-history", room.getOwnRoomHistory);
  server.get("/rooms/user-history/:userId", room.getUserRoomHistory);
  server.get("/rooms/:id", room.getRoom);
}

export async function authApi(server: FastifyInstance): Promise<void> {
  server.post("/auth/sign-up", auth.signUp);
  server.post("/auth/sign-in", auth.signIn);
  server.get("/auth/whoami", auth.whoami);
  server.post("/auth/sign-out", auth.signOut);
}

