import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Validates one editable plan row received from the client.
 */
export class PlanRowDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MaxLength(50)
  personName!: string;

  @IsString()
  @MaxLength(50)
  role!: string;

  @IsString()
  @MaxLength(50)
  team!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  allocationPct!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
