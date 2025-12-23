import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoldColumnsToAssets1766410551427 implements MigrationInterface {
  name = 'AddSoldColumnsToAssets1766410551427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "sold_price" numeric`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "sold_date" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "sold_date"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "sold_price"`);
  }
}
