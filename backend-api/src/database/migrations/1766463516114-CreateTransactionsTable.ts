import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1766463516114 implements MigrationInterface {
  name = 'CreateTransactionsTable1766463516114';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "asset_code" character varying NOT NULL, "asset_name" character varying NOT NULL, "asset_type" character varying NOT NULL, "quantity" numeric NOT NULL, "price" numeric NOT NULL, "total_amount" numeric NOT NULL, "transaction_type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" integer NOT NULL, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
  }
}
