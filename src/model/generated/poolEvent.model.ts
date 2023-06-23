import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {EventType} from "./_eventType"

@Entity_()
export class PoolEvent {
    constructor(props?: Partial<PoolEvent>) {
        Object.assign(this, props)
    }

    /**
     * <evmEventId>
     */
    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("varchar", {length: 8, nullable: false})
    type!: EventType

    @Index_()
    @Column_("text", {nullable: true})
    toAddress!: string | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    senderAddress!: string | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    signerAddress!: string | undefined | null

    @Index_()
    @Column_("int4", {nullable: false})
    blockHeight!: number

    @Column_("int4", {nullable: false})
    indexInBlock!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amount1!: bigint | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amount2!: bigint | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amountIn1!: bigint | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    amountIn2!: bigint | undefined | null

    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
