import { Controller, Get, Query } from '@nestjs/common';
import { EdpService } from './edp.service';

@Controller('edp-kpi')
export class EdpKpiController {
  constructor(private readonly edp: EdpService) {}

  @Get('summary')
  summary(@Query('to_date') toDate?: string) {
    const claims = this.edp.all();
    const byPic = new Map<string, any[]>();
    for (const c of claims) {
      const pic = c.current_pic || 'Unassigned';
      if (!byPic.has(pic)) byPic.set(pic, []);
      byPic.get(pic)!.push(c);
    }

    const rows = Array.from(byPic.entries()).map(([staff, list]) => {
      const closed = list.filter((c) => c.status === 'CLOSED').length;
      const breach = list.filter((c) => (c.sla_status ?? '').toLowerCase().startsWith('breached')).length;
      const total = list.length;
      const pending = total - closed;
      const withinSla = total - breach;
      return {
        staff,
        pool: 'Travel',
        total_assigned: total,
        pending,
        closed,
        within_sla: withinSla,
        near_breach: 0,
        breach,
        compliance_pct: total ? Math.round((withinSla / total) * 100) : 0,
        breach_pct: total ? Math.round((breach / total) * 100) : 0,
        kpi_status: breach > 0 ? 'Red' : 'Green',
      };
    });

    const grand = {
      total_assigned: claims.length,
      pending: claims.filter((c) => c.status !== 'CLOSED').length,
      closed: claims.filter((c) => c.status === 'CLOSED').length,
      within_sla: claims.filter((c) => !(c.sla_status ?? '').toLowerCase().startsWith('breached')).length,
      near_breach: 0,
      breach: claims.filter((c) => (c.sla_status ?? '').toLowerCase().startsWith('breached')).length,
      compliance_pct: 0,
      breach_pct: 0,
    };

    return {
      as_of: toDate ?? new Date().toISOString().slice(0, 10),
      from_date: null,
      to_date: toDate ?? null,
      pool: 'Travel',
      sla_rules: { Travel: { limit: 5, mode: 'calendar' } },
      rows,
      totals_by_pool: [{ pool: 'Travel', ...grand, kpi_status: grand.breach > 0 ? 'Red' : 'Green' }],
      grand_total: grand,
    };
  }

  @Get('daily')
  daily(@Query('days') days?: string) {
    const n = Number(days) || 14;
    const rows = Array.from({ length: n }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (n - 1 - i));
      return {
        date: d.toISOString().slice(0, 10),
        new_registered: Math.floor(Math.random() * 5),
        closed: Math.floor(Math.random() * 3),
        sla_breach: Math.floor(Math.random() * 2),
      };
    });
    return { days: n, end_date: rows[rows.length - 1]?.date ?? null, rows };
  }
}
