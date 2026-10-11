import { IsArray, IsString } from 'class-validator';

export class BatchStockDto {
  @IsArray()
  @IsString({ each: true })
  skus: string[];
}