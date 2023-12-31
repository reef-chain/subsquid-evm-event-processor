# Reef EVM event processor Squid sample

Sample project for processing and indexing EVM events in the Reef chain using the [Subsquid's ArrowSquid version for Substrate chains](https://docs.subsquid.io/sdk/resources/substrate/frontier-evm/).

Built upon [Squid Frontier EVM template](https://github.com/subsquid/squid-frontier-evm-template) and adapted to be used with Reef chain.

This project showcases how to index different events from a `ReefswapV2Pair` contract and can be adapted to index any event from any specific contract.


## Quickstart

- Create a `.env` file with the contents of `.env.sample`.

- Start Docker and run the following commands:

```bash
# 1. Install dependencies
npm install

# 2. Compile typescript files
make build

# 3. Start target Postgres database and detach
#    DB will be available at localhost:23799/evm_events
make up

# 4. Start the processor
make process

# 5. In a separate terminal, start graphql server
#    GraphQL API will be available at http://localhost:4350/graphql
make serve

# 6. Stop and destroy target Postgres database
make down
```


## Dev flow

### 1. Define database schema

Delete migration files from `db/migrations` directory and define the schema of the target database via `schema.graphql` file, replacing the sample definition.
Schema definition consists of regular graphql type declarations annotated with custom directives.
Full description of `schema.graphql` dialect is available [here](https://docs.subsquid.io/sdk/reference/schema-file/).

### 2. Generate TypeORM classes

Mapping developers use TypeORM [EntityManager](https://typeorm.io/#/working-with-entity-manager)
to interact with target database during data processing. All necessary entity classes are
generated by the squid framework from `schema.graphql`. This is done by running the following command:

```bash
make codegen
```

### 3. Import ABI contract and generate interfaces to decode events

It is necessary to import the respective ABI definition to decode EVM logs.

Delete all the contents in `src/abi` and insert the JSON ABI definition of the contract to index.

To generate a type-safe facade class to decode EVM logs execute the following command:

```bash
npx squid-evm-typegen src/abi src/abi/{YOUR_CONTRACT_NAME}.json
```

And replace the following code in generated the generated `abi.support.ts` file:

```ts
let result = await this._chain.client.call('eth_call', [
      { to: this.address, data },
      '0x' + this.blockHeight.toString(16)
])
```
by

```ts
let result = await this._chain.client.call('evm_call', [
      {to: this.address, data, from: undefined, storageLimit: 0}
])
```

### 4. Specify the contract to index

Add the address of the contract to index in the `.env` file:

```
CONTRACT_ADDRESS=0x...
```

### 5. Define the events to index

In the `src/processor.ts` file, import the generated ABI file and add the events to index in the `addEvmLog` method.

```ts
import * as YourContract from "./abi/YourContract";

// ...

const processor = new SubstrateBatchProcessor()
  .setBlockRange({ from: START_BLOCK })
  .setDataSource({ 
    chain: { url: RPC_URL, rateLimit: 10 },
    archive: ARCHIVE 
  }).addEvmLog({
    address: [
      CONTRACT_ADDRESS
    ],
    topic0: [
      YourContract.events.EventOne.topic,
      YourContract.events.EventTwo.topic,
    ],
    extrinsic: true
  }).setFields(fields);
```

### 6. Implement the event handler

In the `src/process/EventManager.ts` file implement the event processing handler for each event to index and compile the typescript files executing the following command:

```bash
make build
```

### 7. Run the processor

```bash
# Start target Postgres database and detach
make up

# Generate DB migration file (should be done every time the schema changes)
make migration

# Start the processor
make process

# In a separate terminal, start graphql server
make serve
```

## Advanced features

### View tables

Currently Subsquid does not have a direct support for views generation. In order to create and expose custom view tables:

1. Create a custom script with the corresponding insertions of functions and views to the database and place it in `db/migrations` directory.

2. Add in the `schema.graphql` entities with the structure of the view tables to expose the views in the GraphQL API.

**IMPORTANT**: To prevent the generation of the models for the view tables, the view entities should be commented in the `schema.graphql` file every time the TypeORM classes are generated with the `make codegen` command.


### Project examples

[Reef explorer](https://github.com/reef-chain/subsquid-processor)

[Reef DEX](https://github.com/reef-chain/subsquid-processor-dex)

[Sqwid marketplace](https://github.com/sqwid-app/marketplace-indexer)


## Deploy API to the Subsquid Hosted service?

Login to the [Subsquid Hosted Service](https://app.subsquid.io) with your github handle to obtain a deployment key. Then create a Squid (that is, your deployment) and follow the instructions.


## Project conventions

Squid tools assume a certain project layout.

* All compiled js files must reside in `lib` and all TypeScript sources in `src`.
The layout of `lib` must reflect `src`.
* All TypeORM classes must be exported by `src/model/index.ts` (`lib/model` module).
* Database schema must be defined in `schema.graphql`.
* Database migrations must reside in `db/migrations` and must be plain js files.
* `sqd` and `squid-*` executables consult `.env` file for a number of environment variables.


## Graphql server extensions

It is possible to extend `squid-graphql-server` with custom
[type-graphql](https://typegraphql.com) resolvers and to add request validation.
