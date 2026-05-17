import { IsString, IsOptional } from 'class-validator';

export class CreateNftDto {
  @IsString() tokenId: string;
  @IsString() owner: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUri?: string;
  @IsOptional() @IsString() gameId?: string;
  @IsOptional() @IsString() rarity?: string;
  @IsOptional() @IsString() contractAddress?: string;
}
