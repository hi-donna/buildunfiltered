import data from "@/data/codenames.json";

// The codename list handed to new accounts, in order. The database holds the
// same list (supabase/schema.sql is generated from this file); this module
// only types it and checks it at build time. Assignment happens in Postgres
// (see handle_new_user in the schema), never in the browser.

export interface Codename { position: number; name: string; reserved?: boolean }

const list = data.codenames as Codename[];
const reserved = data.reserved as string[];

function check(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`data/codenames.json: ${msg}`);
}

const names = new Set<string>();
list.forEach((c, i) => {
  check(c.position === i + 1, `position ${c.position} at index ${i}; positions must be 1..n in order`);
  check(!names.has(c.name.toLowerCase()), `duplicate name "${c.name}"`);
  names.add(c.name.toLowerCase());
});
for (const r of reserved) {
  const hit = list.find((c) => c.name === r);
  check(!!hit && hit.reserved === true, `reserved name "${r}" must be in the list with reserved: true`);
}
check(list.filter((c) => !c.reserved).length >= 100, "fewer than 100 assignable codenames");

export const codenames: Codename[] = list;
export const assignable: Codename[] = list.filter((c) => !c.reserved);
export const reservedNames: string[] = reserved;
