import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {AirTag} from "./airTag.entity";
import {UserAirTag} from "./userAirTag.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        unique: true
    })
    username!: string;

    @Column({
        nullable: true
    })
    encryptedId?: string;

    @Column("timestamp without time zone")
    createdAt!: Date;

    @OneToMany(() => UserAirTag, (userAirTag) => userAirTag.user)
    airTags!: UserAirTag[];
}