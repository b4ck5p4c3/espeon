import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { IsISO8601, IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { UserAirTagsService } from '../airTags/userAirTags/userAirTags.service';

class SearchMultipleAirTagsReportsDTO {
  @IsISO8601()
  from: string;

  @IsISO8601()
  to: string;

  @IsUUID(undefined, { each: true })
  airTagsIds: string[];
}

interface AirTagsReportsResults {
  [id: string]: {
    payload: string;
    time: string;
  }[];
}

@Controller('reports')
export class ReportsController implements OnModuleInit {
  private maxAirTagsPerQuery: number;

  constructor(
    private reportsService: ReportsService,
    private userAirTagsService: UserAirTagsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.maxAirTagsPerQuery = parseInt(
      this.configService.getOrThrow('MAX_AIRTAGS_PER_QUERY'),
    );
  }

  @Post('search/multiple')
  async getMultipleTagReports(@Body() data: SearchMultipleAirTagsReportsDTO) {
    let timeTo: Date = new Date(data.to);
    let timeFrom: Date = new Date(data.from);

    if (timeTo.getTime() - timeFrom.getTime() < 0) {
      throw new HttpException('from must be < to', HttpStatus.BAD_REQUEST);
    }

    if (timeTo.getTime() - timeFrom.getTime() > 30 * 24 * 60 * 60 * 1000) {
      throw new HttpException(
        'to - from must be no longer than month',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.airTagsIds.length > this.maxAirTagsPerQuery) {
      throw new HttpException(
        'Too many AirTags in one query',
        HttpStatus.BAD_REQUEST,
      );
    }

    const airTags = await this.userAirTagsService.findManyByIds(
      data.airTagsIds,
    );

    const promises = airTags.map(async (tag) => {
      const reports = await this.reportsService.findReportsByAirTag(
        tag.airTag,
        timeFrom,
        timeTo,
      );

      return [
        tag.id,
        reports.map((report) => ({
          payload: report.payload,
          time: report.time.toISOString(),
        })),
      ];
    });

    return Object.fromEntries(await Promise.all(promises));
  }
}
