import { db } from "connectors/db";
import { User } from "db/models/user";
import { CreateUserPayload, UpdateUserPayload } from "./types";

class UserService {
  private userRepository = db.getRepository(User);
  public async getUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await this.userRepository.findOneBy({
      email
    })

    return user;
  }

  public async getUserByNickname(nickname: string): Promise<User | null> {
    if (!nickname) {
      throw new Error("Username is required");
    }

    const user = await this.userRepository.findOneBy({
      nickname
    })

    return user;
  }

  public async getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  public async getUserById(id: number): Promise<User | null> {
    if (!id) {
      throw new Error("Id is required");
    }

    const user = await this.userRepository.findOneBy({
      id
    })

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  public async createUser(user: CreateUserPayload): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  public async updateUser(id: number, user: UpdateUserPayload): Promise<User> {
    if (!id) {
      throw new Error("Id is required");
    }

    const existingUser = await this.userRepository.findOneBy({
      id
    })

    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = this.userRepository.merge(existingUser, user);
    return this.userRepository.save(updatedUser);
  }
}

export const userService = new UserService();