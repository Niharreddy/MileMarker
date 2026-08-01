/**
 * Compile-time exhaustiveness check for switch/if-else chains over a union.
 * Call in the `default`/`else` branch — if a new union member is added
 * without handling it, this line fails to type-check.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
