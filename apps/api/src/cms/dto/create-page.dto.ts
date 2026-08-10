export class CreatePageDto {
  title!: string;
  slug!: string;
  content?: string;
  published?: boolean;
}
