import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {AirTag} from "../common/database/entities/airTag.entity";
import {Between, Repository} from "typeorm";
import {Report} from "../common/database/entities/report.entity";

@Injectable()
export class ReportsService {
    constructor(@InjectRepository(Report) private reportsRepository: Repository<Report>) {
    }

    async findReportsByAirTag(airTag: AirTag, from: Date, to: Date): Promise<Report[]> {
        return this.reportsRepository.find({
            where: {
                airTag,
                time: Between(from, to)
            }
        });
    }

    async findLastReportByAirTag(airTag: AirTag): Promise<Report | null> {
        return this.reportsRepository.findOne({
            where: {
                airTag
            },
            order: {
                time: "desc"
            }
        });
    }

    async addReport(id: string, airTag: AirTag, payload: string, time: Date): Promise<void> {
        const report = this.reportsRepository.create({
            id,
            airTag,
            payload,
            time
        });
        await this.reportsRepository.upsert(report, ["id"]);
    }
}