import {Body, Controller, Get, HttpException, HttpStatus, OnModuleInit, Param, Patch, Post} from '@nestjs/common';
import {UsersService} from "./users.service";
import {IsBase64, IsNotEmpty, IsString, IsUUID} from "class-validator";
import {ConfigService} from "@nestjs/config";

class RegisterDTO {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsString()
    registerToken: string;
}

class LoginDTO {
    @IsNotEmpty()
    @IsString()
    username: string;
}

class UpdateEncryptedIdDTO {
    @IsNotEmpty()
    @IsBase64()
    encryptedId: string;
}

class UpdateProfileDTO {
    @IsNotEmpty()
    @IsString()
    username: string;
}

@Controller("users")
export class UsersController implements OnModuleInit {
    private registerToken: string;
    constructor(private usersService: UsersService, private configService: ConfigService) {
    }

    onModuleInit() {
        this.registerToken = this.configService.getOrThrow("REGISTER_TOKEN");
    }

    @Post("register")
    async register(@Body() registerDto: RegisterDTO) {
        if (registerDto.registerToken !== this.registerToken) {
            throw new HttpException("Invalid register token", HttpStatus.UNAUTHORIZED);
        }

        const user = await this.usersService.findUserByUsername(registerDto.username);
        if (user) {
            throw new HttpException("User already registered", HttpStatus.BAD_REQUEST);
        }

        const newUser = await this.usersService.createUser(registerDto.username);
        return {
            id: newUser.id
        };
    }

    @Patch(":id/encrypted")
    async updateEncryptedId(@Param("id") id: string, @Body() updateEncryptedIdDto: UpdateEncryptedIdDTO) {
        const user = await this.usersService.findUserById(id);
        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        user.encryptedId = updateEncryptedIdDto.encryptedId;

        await this.usersService.updateUser(user);

        return {};
    }

    @Patch(":id/profile")
    async updateProfile(@Param("id") id: string, @Body() updateProfileDto: UpdateProfileDTO) {
        const user = await this.usersService.findUserById(id);
        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        if (user.username !== updateProfileDto.username) {
            const existingUser = await this.usersService.findUserByUsername(updateProfileDto.username);
            if (existingUser) {
                throw new HttpException("User with this username already exists", HttpStatus.BAD_REQUEST);
            }

            user.username = updateProfileDto.username;
        }

        await this.usersService.updateUser(user);

        return {};
    }

    @Get(":id/encrypted")
    async getEncryptedId(@Param("id") id: string) {
        const user = await this.usersService.findUserById(id);
        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        return {
            encryptedId: user.encryptedId
        };
    }

    @Get(":id/profile")
    async getProfile(@Param("id") id: string) {
        const user = await this.usersService.findUserById(id);
        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        return {
            username: user.username
        };
    }

    @Post("login")
    async login(@Body() loginDto: LoginDTO) {
        const user = await this.usersService.findUserByUsername(loginDto.username);
        if (!user) {
            throw new HttpException("Wrong username", HttpStatus.UNAUTHORIZED);
        }

        return {
            encryptedId: user.encryptedId
        };
    }
}
