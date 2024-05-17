import {AirTag} from "./airTag.entity";
import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";

@Entity()
export class Report {
    @PrimaryColumn("uuid")
    id!: string;

    @Column("timestamp without time zone")
    time!: Date;

    @Column()
    payload!: string;

    @ManyToOne(() => AirTag, (airTag) => airTag.reports, {onDelete: "CASCADE"})
    airTag!: AirTag;
}
