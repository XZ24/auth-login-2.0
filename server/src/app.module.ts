import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { EmailsController } from './emails.controller';
import { SpaController } from './spa.controller';
import { AuthController } from './auth.controller';
import { EdpClaimsController } from './edp-claims.controller';
import { EdpMetaController } from './edp-meta.controller';
import { EdpKpiController } from './edp-kpi.controller';
import { DataService } from './data.service';
import { EdpService } from './edp.service';

@Module({
  controllers: [
    ClaimsController,
    EmailsController,
    AuthController,
    EdpClaimsController,
    EdpMetaController,
    EdpKpiController,
    SpaController,
  ],
  providers: [DataService, EdpService],
})
export class AppModule {}
