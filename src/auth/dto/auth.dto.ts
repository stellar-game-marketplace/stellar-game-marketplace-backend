import { IsString } from 'class-validator';

export class AuthChallengeDto {
  @IsString() address: string;
}

export class AuthVerifyDto {
  @IsString() address: string;
  @IsString() signature: string; // base64-encoded Ed25519 signature of the challenge
  @IsString() challenge: string;
}
