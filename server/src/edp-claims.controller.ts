import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { EdpService } from './edp.service';

@Controller('edp-claims')
export class EdpClaimsController {
  constructor(private readonly edp: EdpService) {}

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.edp.list(query);
  }

  @Post('send-bank-details-reminder')
  sendBankDetailsReminder(@Body() body: { claim_nos?: string[] }) {
    return this.sendReminder(body?.claim_nos ?? []);
  }

  @Post('send-payment-reissue-reminder')
  sendPaymentReissueReminder(@Body() body: { claim_nos?: string[] }) {
    return this.sendReminder(body?.claim_nos ?? []);
  }

  private sendReminder(claimNos: string[]) {
    const results = claimNos.map((claim_no) => {
      const claim = this.edp.find(claim_no);
      if (!claim) return { claim_no, email: null, sent: false, error: 'Claim not found' };
      if (!claim.email) return { claim_no, email: null, sent: false, error: 'No email on file' };
      return { claim_no, email: claim.email, sent: true, error: null };
    });
    return {
      requested: claimNos.length,
      sent: results.filter((r) => r.sent).length,
      failed: results.filter((r) => !r.sent).length,
      results,
    };
  }

  @Get(':claimNo')
  getOne(@Param('claimNo') claimNo: string) {
    const claim = this.edp.find(claimNo);
    if (!claim) throw new NotFoundException(`EDP claim ${claimNo} not found`);
    return claim;
  }

  @Patch(':claimNo')
  update(@Param('claimNo') claimNo: string, @Body() updates: Record<string, any>) {
    const updated = this.edp.update(claimNo, updates);
    if (!updated) throw new NotFoundException(`EDP claim ${claimNo} not found`);
    return updated;
  }
}
