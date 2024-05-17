import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

export interface ReportsData {
    [advertisementKey: string]: {
        payload: string,
        dataPublished: Date,
        description: string
    }[];
}

interface RawReportsResponse {
    results: {
        datePublished: number,
        payload: string,
        description: string,
        id: string,
        statusCode: number
    }[],
    statusCode: string
}

@Injectable()
export class AppleFindMyService implements OnModuleInit {
    private appleFindMyUrl: string;

    constructor(private configService: ConfigService) {
    }

    onModuleInit() {
        this.appleFindMyUrl = this.configService.getOrThrow("APPLE_FINDMY_URL");
    }

    async getReports(advertisementKeys: string[]): Promise<ReportsData> {
        const rawReportsResponse: RawReportsResponse = await (await fetch(this.appleFindMyUrl, {
            method: "POST",
            body: JSON.stringify({
                ids: advertisementKeys
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })).json();

        const results: ReportsData = {};

        for (const key of advertisementKeys) {
            results[key] = [];
        }

        for (const report of rawReportsResponse.results) {
            results[report.id].push({
                payload: report.payload,
                dataPublished: new Date(report.datePublished),
                description: report.description
            });
        }

        return results;
    }
}