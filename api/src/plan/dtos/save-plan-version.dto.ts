import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanRowDto } from './plan-row.dto.js';

/**
 * Validates a request to save the current plan as a named version.
 */
export class SavePlanVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => PlanRowDto)
  rows!: PlanRowDto[];
}
