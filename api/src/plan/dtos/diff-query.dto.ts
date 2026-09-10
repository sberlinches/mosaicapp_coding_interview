import { IsUUID } from 'class-validator';

/**
 * Validates the two versions selected for comparison.
 */
export class DiffQueryDto {
  @IsUUID()
  earlierId!: string;

  @IsUUID()
  laterId!: string;
}
