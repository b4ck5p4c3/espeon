import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from "typeorm";
import {User} from "./user.entity";
import {AirTag} from "./airTag.entity";

@Entity()
@Unique(["user", "airTag"])
export class UserAirTag {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    encryptedPrivateData!: string;

    @ManyToOne(() => User, (user) => user.airTags)
    user!: User;

    @ManyToOne(() => AirTag, (airTag) => airTag.userAirTags)
    airTag!: AirTag;
}