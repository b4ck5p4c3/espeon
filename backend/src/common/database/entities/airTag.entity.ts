import {Column, Entity, ManyToOne, OneToMany, PrimaryColumn} from "typeorm";
import {User} from "./user.entity";
import {Report} from "./report.entity";
import {UserAirTag} from "./userAirTag.entity";

@Entity()
export class AirTag {
    @PrimaryColumn("text")
    advertisementKey!: string;

    @Column("timestamp without time zone", {
        nullable: true
    })
    lastFetchTime?: Date;

    @OneToMany(() => UserAirTag, (userAirTag) => userAirTag.airTag)
    userAirTags!: UserAirTag[];

    @OneToMany(() => Report, (report) => report.airTag)
    reports!: Report[];
}