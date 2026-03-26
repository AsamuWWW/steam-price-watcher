import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

function isPrivateIp(ip: string): boolean {
  // Remove IPv6 mapped IPv4 prefix
  const normalizedIp = ip.replace(/^::ffff:/, '');

  if (normalizedIp === '127.0.0.1' || normalizedIp === '::1' || normalizedIp === 'localhost') {
    return true;
  }

  // RFC1918 private ranges
  const parts = normalizedIp.split('.').map(Number);
  if (parts.length !== 4) return false;

  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

@Injectable()
export class AdminIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      request.ip ||
      '';

    if (isPrivateIp(ip)) {
      return true;
    }

    throw new ForbiddenException('Admin access is restricted to internal network only');
  }
}
