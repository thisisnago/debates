import { db } from "connectors/db";
import { Room } from "db/models/room";
import { CreateRoomPayload } from "./types";
import { RoomStatusEnum } from "db/enums/room-status";
import { In } from "typeorm";
import { userService } from "services/user";
import { User } from "db/models/user";
import { friendService } from "services/friend";
import { TeamsEnum } from "db/enums/teams";
import { OrderDirectionEnum } from "db/enums/order-direction";
import { likeService } from "services/like";

class RoomService {
  private roomRepository = db.getRepository(Room);

  private async updateRoomStatus(userId: number, roomId: number, newStatus: RoomStatusEnum): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("UserId and RoomId are required");
    }

    const room = await this.getRoomById(roomId);
    const user = await userService.getUserById(userId) as User;

    if (room.owner.id !== user.id) {
      throw new Error("You are not the owner");
    }

    room.status = newStatus;
    return await this.roomRepository.save(room);
  }

  public async getUserEndedRooms(userId: number): Promise<Room[]> {
    if (!userId) {
      throw new Error("UserId is required");
    }

    return this.roomRepository.find({
      where: [
        { proTeam: { id: userId }, status: RoomStatusEnum.ENDED },
        { conTeam: { id: userId }, status: RoomStatusEnum.ENDED },
        { judge: { id: userId }, status: RoomStatusEnum.ENDED },
      ],
      relations: ['owner', 'judge', 'proTeam', 'conTeam', 'winners', 'members']
    });
  }

  public async createRoom(ownerId: number, payload: CreateRoomPayload): Promise<Room> {
    const { judgeId, proTeamIds, conTeamIds } = payload;

    if (!ownerId || !proTeamIds.length || !conTeamIds.length) {
      throw new Error("Ids are required");
    }

    const owner = await userService.getUserById(ownerId);

    if (!owner) {
      throw new Error("Owner not found");
    }

    const activeRoom = await this.roomRepository.findOne({
      where: {
        owner: {id: owner.id}, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING])
      }
    });

    if (activeRoom) {
      throw new Error("You have already active room");
    }

    const friends = await friendService.getFriends(ownerId);

    if (!friends) {
      throw new Error("No friends found");
    }

    const allowedRoomIds = [...friends.map(friend => friend.friend.id), ownerId];

    const roomUsersPool = [judgeId, ...proTeamIds, ...conTeamIds];

    const areAllUsersAllowed = roomUsersPool.every(roomUserId => allowedRoomIds.includes(roomUserId));

    if (!areAllUsersAllowed) {
      throw new Error("Not all users in the room are friends");
    }

    const allowedUsers = [
      ...friends.map(friend => friend.friend),
      owner
    ];

    const judge = allowedUsers.find(user => user.id === judgeId);

    if (!judge) {
      throw new Error("Judge not found");
    }

    const proTeam = allowedUsers.filter(user => proTeamIds.includes(user.id));

    if (!proTeam) {
      throw new Error("ProTeam not found");
    }

    const conTeam = allowedUsers.filter(user => conTeamIds.includes(user.id));

    if (!conTeam) {
      throw new Error("ConTeam not found");
    }

    const newRoom = this.roomRepository.create({ ...payload, owner, judge, proTeam, conTeam });

    return this.roomRepository.save(newRoom);
  }

  public async checkIsRoomValid(userId: number, roomId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("UserId and RoomId are required");
    }

    const room = await this.roomRepository.findOne({
      where: [
        { id: roomId, proTeam: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
        { id: roomId, conTeam: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
        { id: roomId, judge: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
      ],
      relations: ['owner', 'judge', 'proTeam', 'conTeam', 'winners', 'members']
    })

    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }

  public async getRoomById(id: number): Promise<Room> {
    if (!id) {
      throw new Error("RoomId is required");
    }

    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['owner', 'judge', 'proTeam', 'conTeam', 'winners', 'members']
    });

    if (!room) {
      throw new Error('Room not found');
    }

    return room;
  }

  public async startRoom(userId: number, roomId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("Ids are required");
    }

    const room = await this.getRoomById(roomId);

    if (room.owner.id != userId) {
      throw new Error("You are not owner");
    }

    if (room.status === RoomStatusEnum.STARTED) {
      throw new Error("Room is already started");
    }

    if (room.status === RoomStatusEnum.ENDED) {
      throw new Error("Room is already ended");
    }

    if (room.status === RoomStatusEnum.PAUSED) {
      throw new Error("Room is paused");
    }

    room.status = RoomStatusEnum.STARTED;
    return await this.roomRepository.save(room);
  }

  public async joinRoomById(userId: number, roomId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("Ids are required");
    }

    const room = await this.getRoomById(roomId);
    const user = await userService.getUserById(userId) as User;

    const usersInRoom = room.proTeam.concat(room.conTeam, room.judge);

    if (!usersInRoom.some(userInRoom => userInRoom.id === user.id)) {
      throw new Error("User isn't in room");
    }

    room.members.push(user);
    return await this.roomRepository.save(room);
  }

  public async endRoom(userId: number, roomId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("UserId and RoomId are required");
    }

    const room = await this.getRoomById(roomId);
    const user = await userService.getUserById(userId) as User;

    if (room.owner.id != user.id) {
      throw new Error("You are not owner");
    }

    if (room.status === RoomStatusEnum.ENDED) {
      throw new Error("Room is already ended");
    }

    room.status = RoomStatusEnum.ENDED;
    return await this.roomRepository.save(room);
  }

  public async pauseRoom(userId: number, roomId: number): Promise<Room> {
    return await this.updateRoomStatus(userId, roomId, RoomStatusEnum.PAUSED);
  }

  public async resumeRoom(userId: number, roomId: number): Promise<Room> {
    return await this.updateRoomStatus(userId, roomId, RoomStatusEnum.STARTED);
  }

  public async isLive(userId: number): Promise<Room | null> {
    const user = await userService.getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const room = await this.roomRepository.findOne({
      where: [
        { proTeam: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
        { conTeam: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
        { judge: { id: userId }, status: In([RoomStatusEnum.PENDING, RoomStatusEnum.STARTED, RoomStatusEnum.PAUSED, RoomStatusEnum.GRADING]) },
      ],
      relations: ['owner', 'judge', 'proTeam', 'conTeam', 'winners', 'members']
    });

    return room;
  }

  public async leaveRoom(userId: number, roomId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("Ids are required");
    }
    const room = await this.getRoomById(roomId);
    const user = await userService.getUserById(userId) as User;

    if (!room.members.some(member => member.id === user.id)) {
      throw new Error("User is not a room member");
    }

    room.members = room.members.filter(member => member.nickname !== user.nickname);
    return await this.roomRepository.save(room);
  }

  public async setStatus(roomId: number, status: RoomStatusEnum): Promise<Room> {
    if (!roomId) {
      throw new Error("RoomId is required");
    }
    const room = await this.getRoomById(roomId);

    room.status = status;

    return await this.roomRepository.save(room);
  }

  public async gradeRoom(userId: number, roomId: number, team: TeamsEnum): Promise<Room> {
    if (!userId || !roomId || !team) {
      throw new Error("Ids and team are required");
    }

    const room = await this.getRoomById(roomId);

    if (!room.notGraded) {
      throw new Error("Room status is not grading");
    }

    if (room.judge.id != userId) {
      throw new Error("User is not a judge");
    }

    room.notGraded = false;
    room.winners = team === TeamsEnum.PRO_TEAM ? room.proTeam : room.conTeam;
    room.status = RoomStatusEnum.ENDED;

    return await this.roomRepository.save(room);
  }

  public async getPublicRooms(userId: number, orderDirection?: OrderDirectionEnum): Promise<Room[]> {
    const rooms = await this.roomRepository 
    .createQueryBuilder('room')
    .loadRelationCountAndMap('room.likesCount', 'room.likes')
    .where('room.isPublic = :isPublic', { isPublic: true })
    .andWhere('room.status = :status', { status: RoomStatusEnum.ENDED })
    .groupBy('room.id') 
    .orderBy('COUNT(likes.id)', orderDirection || OrderDirectionEnum.DESC)
    .leftJoin('room.likes', 'likes') 
    .getMany(); 

    const roomsWithIsLikedByCurrentUser: Room[] = await Promise.all(
      rooms.map(async (room) => {
          const isLiked = await likeService.findLike(room.id, userId);
          return {
              ...room,
              isLikedByCurrentUser: isLiked ? true : false,
          };
      })
    );

    return roomsWithIsLikedByCurrentUser;
  }

  public async publishRoom(roomId: number, userId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("Ids are required");
    }

    const room = await this.getRoomById(roomId);

    if (room.owner.id != userId) {
      throw new Error("User is not a owner");
    }

    if (room.isPublic) {
      throw new Error("Room is already public");
    }

    room.isPublic = true;

    return await this.roomRepository.save(room);
  }

  public async unpublishRoom(roomId: number, userId: number): Promise<Room> {
    if (!userId || !roomId) {
      throw new Error("Ids are required");
    }

    const room = await this.getRoomById(roomId);

    if (room.owner.id != userId) {
      throw new Error("User is not a owner");
    }

    if (!room.isPublic) {
      throw new Error("Room is already non-public");
    }

    room.isPublic = false;

    return await this.roomRepository.save(room);
  }
}

export const roomService = new RoomService();
