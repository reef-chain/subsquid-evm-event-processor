import { LogDescription } from "ethers";
import { Event } from "@subsquid/substrate-processor";
import * as ReefswapV2Pair from "../abi/ReefswapV2Pair";
import { EventType, PoolEvent } from "../model";
import { Fields, ctx } from "../processor";
import { hexToNativeAddress } from "./util";

export class EventManager {
    poolEventsCache: PoolEvent[] = [];

    // Process an event and add it to the cache
    async process(event: Event<Fields>): Promise<void> {
        // Map common fields
        const poolEventBase = new PoolEvent ({
            id: event.id,
            blockHeight: event.block.height,
            indexInBlock: event.extrinsic?.index,
            signerAddress: hexToNativeAddress(event.extrinsic?.signature?.address as string),
            timestamp: new Date(event.block.timestamp!),
        });

        // Map event-specific fields
        const eventData = ReefswapV2Pair.abi.parseLog(event.args);
        if (!eventData) return;

        const topic0 = event.args.topics[0] || "";
        switch (topic0) {
            case ReefswapV2Pair.events.Mint.topic:
                this.processMintEvent(poolEventBase, eventData);
                break;
            case ReefswapV2Pair.events.Burn.topic:
                this.processBurnEvent(poolEventBase, eventData);
                break;
            case ReefswapV2Pair.events.Swap.topic:
                this.processSwapEvent(poolEventBase, eventData);
                break;
            case ReefswapV2Pair.events.Transfer.topic:
                this.processTransferEvent(poolEventBase, eventData);
                break;
            default:
                throw new Error(`Unknown event topic: ${topic0}`);
        }
        
        // Add to cache
        this.poolEventsCache.push(poolEventBase);
    }

    // Persist the cache to the database
    async save(): Promise<void> {
        await ctx.store.save(this.poolEventsCache);
    }

    private processMintEvent(poolEvent: PoolEvent, eventData: LogDescription): void {
        poolEvent.type = EventType.Mint;
        const [sender, amount0, amount1] = eventData.args;
        poolEvent.senderAddress = sender;
        poolEvent.amount1 = amount0.toString();
        poolEvent.amount2 = amount1.toString();
    }

    private processBurnEvent(poolEvent: PoolEvent, eventData: LogDescription): void {
        poolEvent.type = EventType.Burn;
        const [sender, amount0, amount1, to] = eventData.args;
        poolEvent.senderAddress = sender;
        poolEvent.amount1 = amount0.toString();
        poolEvent.amount2 = amount1.toString();
        poolEvent.toAddress = to;
    }

    private processSwapEvent(poolEvent: PoolEvent, eventData: LogDescription): void {
        poolEvent.type = EventType.Swap;
        const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = eventData.args;
        poolEvent.senderAddress = sender;
        poolEvent.amountIn1 = amount0In.toString();
        poolEvent.amountIn2 = amount1In.toString();
        poolEvent.amount1 = amount0Out.toString();
        poolEvent.amount2 = amount1Out.toString();
        poolEvent.toAddress = to;
    }

    private processTransferEvent(poolEvent: PoolEvent, eventData: LogDescription): void {
        poolEvent.type = EventType.Transfer;
        const [from, to, value] = eventData.args;
        poolEvent.senderAddress = from;
        poolEvent.toAddress = to;
        poolEvent.amount1 = value.toString();
    }
}