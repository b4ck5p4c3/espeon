import {ReportsService} from "../reports.service";
import {createHash} from "crypto";
import {AirTag} from "../../common/database/entities/airTag.entity";
import {Injectable} from "@nestjs/common";

interface ReportData {
    payload: string;
    time: Date;
}

function getIdFromPayload(payload: string): string {
    const rawId = createHash("sha256").update(Buffer.from(payload, "base64")).digest();
    const thirdPart = [...rawId.subarray(6, 8)];
    thirdPart[0] = thirdPart[0] & 0xf | 0x40;
    const fourthPart = [...rawId.subarray(8, 10)];
    fourthPart[0] = fourthPart[0] & 0x3f | 0x80;

    return `${rawId.subarray(0, 4).toString("hex")}-${
        rawId.subarray(4, 6).toString("hex")}-${
        Buffer.from(thirdPart).toString("hex")}-${
        Buffer.from(fourthPart).toString("hex")}-${
        rawId.subarray(10, 16).toString("hex")}`;
}

@Injectable()
export class ReportsPusherService {
    constructor(private reportsService: ReportsService) {
    }

    async pushReports(airTag: AirTag, reports: ReportData[]): Promise<void> {
        for (const report of reports) {
            await this.reportsService.addReport(getIdFromPayload(report.payload), airTag, report.payload, report.time);
        }
    }
}