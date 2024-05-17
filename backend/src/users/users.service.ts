import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../common/database/entities/user.entity";
import {Between, LessThan, MoreThan, Repository} from "typeorm";

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private usersRepository: Repository<User>) {
    }

    async createUser(username: string): Promise<User> {
        const user = this.usersRepository.create({
            username,
            createdAt: new Date()
        });
        await this.usersRepository.save(user);
        return user;
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOneBy({
            username
        });
    }

    async findUserById(id: string): Promise<User | null> {
        return this.usersRepository.findOneBy({
            id
        });
    }

    async updateUser(user: User): Promise<void> {
        await this.usersRepository.save(user);
    }

    async deleteNotRegisteredUsers(retentionTimeS: number): Promise<void> {
        await this.usersRepository.delete({
            encryptedId: null,
            createdAt: LessThan(new Date(Date.now() - retentionTimeS * 1000))
        });
    }
}