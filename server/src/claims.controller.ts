import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly dataService: DataService) {}

  @Get()
  listClaims(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = limit !== undefined ? parseInt(limit, 10) : 100;
    const off = offset !== undefined ? parseInt(offset, 10) : 0;
    return this.dataService.getClaimsList(
      Number.isFinite(lim) ? lim : 100,
      Number.isFinite(off) ? off : 0,
    );
  }

  @Get(':claimNumber')
  getClaimLocal(@Param('claimNumber') claimNumber: string) {
    const trail = this.dataService.getEmailTrail(claimNumber);
    if (!trail) throw new NotFoundException(`Claim ${claimNumber} not found`);
    return trail;
  }

  @Get(':claimNumber/edp-detail')
  getEdpDetail(@Param('claimNumber') claimNumber: string) {
    const detail = this.dataService.getClaimDetail(claimNumber);
    if (!detail) throw new NotFoundException(`EDP detail for claim ${claimNumber} not found`);
    return detail;
  }
}
