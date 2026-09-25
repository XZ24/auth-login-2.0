import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataService {
  private readonly dataDir: string;

  constructor() {
    this.dataDir = path.resolve(__dirname, '..', '..', 'sources_2');
  }

  getClaimsList(limit?: number, offset?: number): any[] {
    const filePath = path.join(this.dataDir, 'claims_list.json');
    const all = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as any[];
    if (limit == null && offset == null) return all;
    const start = Math.max(0, offset ?? 0);
    const end = limit != null ? start + Math.max(0, limit) : all.length;
    return all.slice(start, end);
  }

  getClaimDetail(claimNumber: string): any | null {
    const sanitized = path.basename(claimNumber);
    const filePath = path.join(this.dataDir, 'edp', `${sanitized}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  getEmailTrail(claimNumber: string): any | null {
    const sanitized = path.basename(claimNumber);
    const filePath = path.join(this.dataDir, 'local', `${sanitized}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}
