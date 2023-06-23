import { QualifiedName } from "@subsquid/substrate-processor"

export interface SubstrateExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}

export interface ExtrinsicRaw {
    id: string
    indexInBlock: number
    signature: SubstrateExtrinsicSignature
    version: number
    success: boolean
    hash: string
    pos: number
    error?: any
}

export interface EventRaw {
    id: string
    name: QualifiedName
    args: RawEventData
    pos: number
    extrinsic?: ExtrinsicRaw
}

export interface RawEventData {
    address: string,
    topics:string[],
    data: string,
}