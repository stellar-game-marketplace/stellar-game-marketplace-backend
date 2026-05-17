import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';

@Injectable()
export class AuthService {
  // In-memory challenge store (use Redis in production)
  private challenges = new Map<string, { challenge: string; expiresAt: number }>();

  constructor(private readonly jwtService: JwtService) {}

  generateChallenge(address: string): { challenge: string } {
    const challenge = crypto.randomBytes(32).toString('hex');
    this.challenges.set(address, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { challenge };
  }

  verify(address: string, challenge: string, signature: string): { accessToken: string } {
    const stored = this.challenges.get(address);
    if (!stored || stored.challenge !== challenge || Date.now() > stored.expiresAt) {
      throw new UnauthorizedException('Invalid or expired challenge');
    }

    // Verify Ed25519 signature using Stellar Keypair
    try {
      const keypair = Keypair.fromPublicKey(address);
      const messageBuffer = Buffer.from(challenge, 'utf8');
      const sigBuffer = Buffer.from(signature, 'base64');
      const valid = keypair.verify(messageBuffer, sigBuffer);
      if (!valid) throw new Error('Bad signature');
    } catch {
      throw new UnauthorizedException('Signature verification failed');
    }

    this.challenges.delete(address);
    const accessToken = this.jwtService.sign({ sub: address });
    return { accessToken };
  }
}
