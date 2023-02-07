import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

const DEFAULT_PAGE_SIZE = 10;

export class GetMessagesDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  skip: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
