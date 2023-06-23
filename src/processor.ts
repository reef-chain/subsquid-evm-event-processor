import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import {
  BatchContext,
  BatchProcessorItem,
  SubstrateBatchProcessor,
} from "@subsquid/substrate-processor";
import { KnownArchives, lookupArchive } from "@subsquid/archive-registry";
import * as ReefswapV2Pair from "./abi/ReefswapV2Pair";
import { EventRaw } from "./interfaces/interfaces";
import { EventManager } from "./process/EventManager";  

const RPC_URL = process.env.NODE_RPC_WS;
const AQUARIUM_ARCHIVE_NAME = process.env.ARCHIVE_LOOKUP_NAME as KnownArchives;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as string;
const ARCHIVE = lookupArchive(AQUARIUM_ARCHIVE_NAME);
const START_BLOCK = parseInt(process.env.START_BLOCK || '1') || 1;
console.log(`\nRPC URL: ${RPC_URL}\nContract: ${CONTRACT_ADDRESS}\nArchive: ${ARCHIVE}\nStart block: ${START_BLOCK}\n`);

const database = new TypeormDatabase();
const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: START_BLOCK })
  .setDataSource({ chain: RPC_URL, archive: ARCHIVE })
  .addEvmLog(CONTRACT_ADDRESS, { // Use "*" instead of CONTRACT_ADDRESS to listen to all contracts
    filter: [[
      ReefswapV2Pair.events.Mint.topic,
      ReefswapV2Pair.events.Burn.topic,
      ReefswapV2Pair.events.Swap.topic,
      ReefswapV2Pair.events.Transfer.topic
    ]], // Filter specific events
    data: { event: { args: true, extrinsic: true } }
  });

export type Item = BatchProcessorItem<typeof processor>;
export type Context = BatchContext<Store, Item>;
export let ctx: Context;

// Avoid type errors when serializing BigInts
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

processor.run(database, async (ctx_) => {
  ctx = ctx_;
  const eventManager = new EventManager();
 
  const firstBlock = ctx.blocks[0].header.height;
  const lastBlock = ctx.blocks[ctx.blocks.length - 1].header.height;

  // Iterate over available blocks
  for (const block of ctx.blocks) {
    ctx.log.info(`Processing block ${block.header.height} [${firstBlock} - ${lastBlock}]`);
    // Process events
    for (const item of block.items) {
      if (item.name === 'EVM.Log') {
        const eventRaw = item.event as EventRaw;
        await eventManager.process(eventRaw, block.header);
      }
    }
  }

  // Persist processed data
  ctx.log.info(`Saving blocks from ${firstBlock} to ${lastBlock}`);
  await eventManager.save();
});