import * as ss58 from "@subsquid/ss58";

export const hexToNativeAddress = (address: string | undefined): string => {
    if (!address) return '0x';
    try {
        const buffer = Buffer.from(address.split('0x')[1], "hex");
        return ss58.codec('substrate').encode(new Uint8Array(buffer));
    } catch (error) {
        console.error("Error converting hex value to native address:", error);
        return '0x';
    }
}