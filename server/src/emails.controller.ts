import { Body, Controller, Get, Param, NotFoundException, Post } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly dataService: DataService) {}

  // Mock send: accepts the JSON body shape (no attachments); multipart bodies
  // aren't parsed by default in this mock server, so attachments are ignored.
  @Post('send')
  sendEmail(@Body() body: Record<string, any>) {
    return {
      sent: true,
      sender: 'mock-mailbox@etiqa.com.my',
      to_recipients: body?.to_recipients ?? [],
      cc_recipients: body?.cc_recipients ?? [],
      bcc_recipients: body?.bcc_recipients ?? [],
      subject: body?.subject ?? '',
      attachments: [],
      inline_images: [],
      tracking_id: `mock-${Date.now()}`,
    };
  }

  @Get(':claimNumber')
  getEmailTrail(@Param('claimNumber') claimNumber: string) {
    const trail = this.dataService.getEmailTrail(claimNumber);
    if (!trail) throw new NotFoundException(`Emails for claim ${claimNumber} not found`);
    return trail;
  }
}
