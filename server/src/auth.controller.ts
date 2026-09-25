import { Body, Controller, Post, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// Mock auth service: accepts any non-empty username/password, issues opaque
// tokens tracked in memory. Good enough for local UI development only.
const MOCK_USER = {
  id: 1,
  username: 'demo',
  email: 'demo@etiqa.com.my',
  display_name: 'Demo Assessor',
  role: 'admin',
  pic_name: 'Demo Assessor',
  is_active: true,
};

const refreshTokens = new Set<string>();
const accessTokens = new Map<string, number>(); // token -> user id

function issueTokens() {
  const access_token = `mock-access-${randomUUID()}`;
  const refresh_token = `mock-refresh-${randomUUID()}`;
  accessTokens.set(access_token, MOCK_USER.id);
  refreshTokens.add(refresh_token);
  return { access_token, refresh_token, token_type: 'bearer' };
}

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() body: Record<string, string>) {
    const { username, password } = body ?? {};
    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }
    // Mock: accept any credentials.
    return issueTokens();
  }

  @Post('refresh')
  refresh(@Body() body: { refresh_token?: string }) {
    if (!body?.refresh_token || !refreshTokens.has(body.refresh_token)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    refreshTokens.delete(body.refresh_token);
    return issueTokens();
  }

  @Post('logout')
  logout(@Body() body: { refresh_token?: string }) {
    if (body?.refresh_token) refreshTokens.delete(body.refresh_token);
    return {};
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !accessTokens.has(token)) {
      throw new UnauthorizedException('Missing or invalid access token');
    }
    return MOCK_USER;
  }
}
