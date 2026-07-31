import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// Apply every migration in order, so the tests exercise the real end state.
const MIGRATIONS = [
  "20260731044503_waitlist_schema.sql",
  "20260731062558_stable_waitlist_position.sql",
];
const SQL = MIGRATIONS.map((m) =>
  readFileSync(new URL(`../migrations/${m}`, import.meta.url), "utf8"),
).join("\n");

const db = new PGlite();

// Supabase provides these roles; create them so the migration runs verbatim.
await db.exec(`
  create role anon;
  create role authenticated;
  create role service_role;
`);

await db.exec(SQL);
console.log("✓ migration applied cleanly");

const status = async () => (await db.query("select * from waitlist_status()")).rows[0];
const join = async (email, ref = null) =>
  (await db.query("select * from waitlist_join($1, $2, null)", [email, ref])).rows[0];

// ---- initial state -------------------------------------------------------
let s = await status();
console.log("initial:", s);
assert.equal(s.taken, 58, "should start at 58 taken");
assert.equal(s.cap, 200);
assert.equal(s.spots_left, 142);

// ---- the next signup must be #59 ----------------------------------------
let j = await join("first@example.com");
console.log("first signup:", j);
assert.equal(j.place, 59, "first real signup must be #59");
assert.equal(j.cap, 200);
assert.equal(j.already_registered, false);

// ---- duplicate email is idempotent --------------------------------------
const again = await join("FIRST@Example.com  ");
assert.equal(again.place, 59, "duplicate must return the same position");
assert.equal(again.already_registered, true);
assert.equal(again.ref_code, j.ref_code);
console.log("✓ duplicate email returns same position, no new row");

// ---- invalid email rejected ---------------------------------------------
await assert.rejects(() => join("not-an-email"), /invalid_email/);
console.log("✓ invalid email rejected");

// ---- referrals are recorded but must NOT move your position -------------
await join("friend@example.com", j.ref_code);
const afterRef = await join("first@example.com");
assert.equal(afterRef.place, 59, "position must stay put when someone uses your link");
const ref = await db.query(
  "select referred_by from waitlist_signups where email = 'friend@example.com'",
);
assert.equal(ref.rows[0].referred_by, j.ref_code, "referred_by should still be recorded");
console.log("✓ referral recorded as attribution, position unchanged");

// ---- fill the cap --------------------------------------------------------
for (let i = 0; i < 140; i++) {
  await join(`bulk${i}@example.com`);
}
s = await status();
console.log("at cap:", s);
assert.equal(s.taken, 200, "display should read 200");
assert.equal(s.cap, 200);
assert.equal(s.spots_left, 0);
assert.equal(Number(s.signups), 142, "142 real signups + 58 seed = 200");

// ---- signups keep working past the cap, display holds at 200/200 --------
await join("overflow1@example.com");
await join("overflow2@example.com");
await join("overflow3@example.com");
s = await status();
console.log("past cap (same day):", s);
assert.equal(s.taken, 200, "display must hold at the cap on the fill day");
assert.equal(s.cap, 200);
assert.equal(Number(s.signups), 145, "overflow signups are still stored");
console.log("✓ overflow signups accepted, display frozen at 200/200");

const filledOn = (await db.query("select cap_filled_on from waitlist_config")).rows[0];
assert.ok(filledOn.cap_filled_on, "cap_filled_on should be recorded");

// ---- next day: the 500 tier opens ---------------------------------------
await db.exec("update waitlist_config set cap_filled_on = current_date - 1");
s = await status();
console.log("next day:", s);
assert.equal(s.cap, 500, "cap must advance to 500 the next day");
assert.equal(s.taken, 203, "58 seed + 145 signups");
assert.equal(s.spots_left, 297);
console.log("✓ tier advanced 200 → 500 the following day");

// ---- and it stays there (no repeated jumps) -----------------------------
s = await status();
assert.equal(s.cap, 500, "cap must not keep climbing on subsequent reads");
console.log("✓ cap stable on repeat reads");

// ---- the ladder continues -----------------------------------------------
await db.exec("update waitlist_config set seed_offset = 500");
s = await status();
assert.equal(s.taken, 500);
await db.exec("update waitlist_config set cap_filled_on = current_date - 1");
s = await status();
assert.equal(s.cap, 1000, "next rung of the ladder is 1000");
console.log("✓ ladder continues 500 → 1000");

// ---- browser roles must not reach the data ------------------------------
const grants = await db.query(`
  select grantee, privilege_type from information_schema.role_table_grants
   where table_name = 'waitlist_signups' and grantee in ('anon','authenticated')
`);
assert.equal(grants.rows.length, 0, "anon/authenticated must have no table grants");

const fnAcl = await db.query(`
  select has_function_privilege('anon', 'public.waitlist_join(text,text,text)', 'execute') as anon_exec,
         has_function_privilege('service_role', 'public.waitlist_join(text,text,text)', 'execute') as sr_exec
`);
assert.equal(fnAcl.rows[0].anon_exec, false, "anon must not execute waitlist_join");
assert.equal(fnAcl.rows[0].sr_exec, true, "service_role must execute waitlist_join");

const rls = await db.query(`
  select relname, relrowsecurity from pg_class
   where relname in ('waitlist_signups','waitlist_config')
`);
for (const r of rls.rows) assert.equal(r.relrowsecurity, true, `${r.relname} needs RLS`);
console.log("✓ RLS on, anon/authenticated locked out, service_role allowed");

console.log("\nALL TESTS PASSED");
