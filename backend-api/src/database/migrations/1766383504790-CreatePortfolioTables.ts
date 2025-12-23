import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortfolioTables1766383504790 implements MigrationInterface {
  name = 'CreatePortfolioTables1766383504790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetType" character varying NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "quantity" numeric NOT NULL, "price" numeric NOT NULL, "purchase_date" TIMESTAMP NOT NULL, "current_price" numeric NOT NULL DEFAULT '0', "current value" numeric NOT NULL DEFAULT '0', "gain_loss_percentage" numeric NOT NULL DEFAULT '0', "gain_loss_amount" numeric NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "portfolio_id" uuid, CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_value" numeric NOT NULL DEFAULT '0', " total_gain_loss" numeric NOT NULL DEFAULT '0', "total_return_percentage" numeric NOT NULL DEFAULT '0', "total_cost" numeric NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" integer, CONSTRAINT "REL_57fba72db5ac40768b40f0ecfa" UNIQUE ("user_id"), CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_a6dc6b6ffbcf40f10145ed3e8e3" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolios" ADD CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "portfolios" DROP CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" DROP CONSTRAINT "FK_a6dc6b6ffbcf40f10145ed3e8e3"`,
    );
    await queryRunner.query(`DROP TABLE "portfolios"`);
    await queryRunner.query(`DROP TABLE "assets"`);
  }
}
