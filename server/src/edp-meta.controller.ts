import { Controller, Get } from '@nestjs/common';
import { EdpService } from './edp.service';

// Serves /edp-pics plus the /edp-claims-meta/* dropdown option endpoints.
@Controller()
export class EdpMetaController {
  constructor(private readonly edp: EdpService) {}

  private uniqueSorted(values: (string | null | undefined)[]): string[] {
    return Array.from(new Set(values.filter((v): v is string => !!v && v.trim().length > 0))).sort();
  }

  @Get('edp-pics')
  pics() {
    return this.uniqueSorted(this.edp.all().map((c) => c.current_pic));
  }

  @Get('edp-claims-meta/statuses')
  statuses() {
    return this.uniqueSorted(this.edp.all().map((c) => c.status));
  }

  @Get('edp-claims-meta/current-statuses')
  currentStatuses() {
    return this.uniqueSorted(this.edp.all().map((c) => c.current_status));
  }

  @Get('edp-claims-meta/categories')
  categories() {
    return this.uniqueSorted(this.edp.all().map((c) => c.category));
  }

  @Get('edp-claims-meta/claim-types')
  claimTypes() {
    return this.uniqueSorted(this.edp.all().map((c) => c.claim_type));
  }
}
