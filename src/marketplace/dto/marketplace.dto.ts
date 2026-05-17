import { IsString, IsNumberString, IsOptional, IsNumber } from 'class-validator';

export class CreateListingDto {
  @IsString() listingId: string;
  @IsString() seller: string;
  @IsString() nftContract: string;
  @IsString() tokenId: string;
  @IsNumberString() price: string;
  @IsOptional() @IsString() paymentToken?: string;
  @IsOptional() @IsNumber() expiresAt?: number;
}

export class CreateBidDto {
  @IsString() bidId: string;
  @IsString() bidder: string;
  @IsString() listingId: string;
  @IsNumberString() amount: string;
  @IsOptional() @IsNumber() expiresAt?: number;
}
