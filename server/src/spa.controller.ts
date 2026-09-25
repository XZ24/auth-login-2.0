import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class SpaController {
  @Get()
  serveRoot(@Res() res: Response) {
    const indexPath = path.resolve(__dirname, '..', '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.json({ status: 'ok', message: 'Travel Claim API' });
  }
}
