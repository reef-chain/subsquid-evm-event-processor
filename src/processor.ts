import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { DataHandlerContext, SubstrateBatchProcessor } from "@subsquid/substrate-processor";
import { KnownArchives, lookupArchive } from "@subsquid/archive-registry";
import * as ReefswapV2Pair from "./abi/ReefswapV2Pair";
import { EventManager } from "./process/EventManager";  

const RPC_URL = process.env.NODE_RPC_WS;
const AQUARIUM_ARCHIVE_NAME = process.env.ARCHIVE_LOOKUP_NAME as KnownArchives;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as string;
const USE_ONLY_RPC = process.env.USE_ONLY_RPC === 'true';
const ARCHIVE = USE_ONLY_RPC ? undefined : lookupArchive(AQUARIUM_ARCHIVE_NAME, { release: 'ArrowSquid' });
const START_BLOCK = parseInt(process.env.START_BLOCK || '1');
console.log(`
    RPC URL: ${RPC_URL}
    Contract: ${CONTRACT_ADDRESS}
    Archive: ${USE_ONLY_RPC ? 'None' : ARCHIVE}
    Start block: ${START_BLOCK}
`);

const database = new TypeormDatabase();
export const fields = {
  event: {},
  extrinsic: {
    signature: true,
    success: true,
  },
  block: {
    timestamp: true,
  },
};
export type Fields = typeof fields;

const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: START_BLOCK })
  .setDataSource({ 
    chain: { url: RPC_URL!, rateLimit: 10 },
    archive: ARCHIVE
  }).addEvmLog({
    address: [
      CONTRACT_ADDRESS
    ], // Filter specific contracts
    topic0: [
      ReefswapV2Pair.events.Mint.topic,
      ReefswapV2Pair.events.Burn.topic,
      ReefswapV2Pair.events.Swap.topic,
      ReefswapV2Pair.events.Transfer.topic
    ], // Filter specific events
    extrinsic: true
  }).setFields(fields);

export let ctx: DataHandlerContext<Store, Fields>;

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
    for (const event of block.events) {
      await eventManager.process(event);
    }
  }

  // Persist processed data
  ctx.log.info(`Saving blocks from ${firstBlock} to ${lastBlock}`);
  await eventManager.save();
});