module.exports = class Data1687505127666 {
    name = 'Data1687505127666'

    async up(db) {
        await db.query(`CREATE TABLE "pool_event" ("id" character varying NOT NULL, "type" character varying(8) NOT NULL, "to_address" text, "sender_address" text, "signer_address" text, "block_height" integer NOT NULL, "index_in_block" integer NOT NULL, "amount1" numeric, "amount2" numeric, "amount_in1" numeric, "amount_in2" numeric, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_d84dbf06888f1aca5ee6501c700" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_5ae3939673dbcacd64b4d096a7" ON "pool_event" ("type") `)
        await db.query(`CREATE INDEX "IDX_b9019ae9bf01c1222b8fd6f05b" ON "pool_event" ("to_address") `)
        await db.query(`CREATE INDEX "IDX_bbc0bd39c7c5272d03de336227" ON "pool_event" ("sender_address") `)
        await db.query(`CREATE INDEX "IDX_3048275fa846b084bb1cd106b2" ON "pool_event" ("signer_address") `)
        await db.query(`CREATE INDEX "IDX_0606826978378661ed61b308e2" ON "pool_event" ("block_height") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "pool_event"`)
        await db.query(`DROP INDEX "public"."IDX_5ae3939673dbcacd64b4d096a7"`)
        await db.query(`DROP INDEX "public"."IDX_b9019ae9bf01c1222b8fd6f05b"`)
        await db.query(`DROP INDEX "public"."IDX_bbc0bd39c7c5272d03de336227"`)
        await db.query(`DROP INDEX "public"."IDX_3048275fa846b084bb1cd106b2"`)
        await db.query(`DROP INDEX "public"."IDX_0606826978378661ed61b308e2"`)
    }
}
