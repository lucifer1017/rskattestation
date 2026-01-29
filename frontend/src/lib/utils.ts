export function formatAddress(address: `0x${string}` | string | undefined): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBytes32(bytes: `0x${string}` | string | undefined): string {
  if (!bytes) return "";
  if (bytes.length < 10) return bytes;
  return `${bytes.slice(0, 10)}...${bytes.slice(-8)}`;
}

export function formatRBTC(wei: bigint | string | number): string {
  const value = typeof wei === "string" ? BigInt(wei) : BigInt(wei);
  const rbtc = Number(value) / 1e18;
  return rbtc.toFixed(6);
}