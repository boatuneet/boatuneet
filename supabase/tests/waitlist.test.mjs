import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// Apply every migration in order, so the tests exercise the real end state.
const MIGRATIONS = [
  "20260731044503_waitlist_schema.sql",
  "20260731062558_stable_waitlist_position.sql",
  "20261002090000_valuation_requests.sql",
  "20261020090000_privacy_consent.sql",
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

// ---- valuation requests: boat details, one row per boat -----------------
const addBoat = (make, model, year, hin = null) =>
  db.query(
    "insert into valuation_requests (email, make, model, year, hin) values ('first@example.com', $1, $2, $3, $4)",
    [make, model, year, hin],
  );
await addBoat("Sunseeker", "Manhattan 73", 2012, "XSK12345D404");
await addBoat("Riva", "Aquariva", 2008); // HIN optional, same email twice is fine
await assert.rejects(() => addBoat("Riva", "Aquariva", 1850), /valuation_requests_year/);
await assert.rejects(() => addBoat("Riva", "Aquariva", 2008, "xsk-123"), /valuation_requests_hin/);
await assert.rejects(() => addBoat("", "Aquariva", 2008), /valuation_requests_make_len/);
const vr = await db.query(`
  select relrowsecurity,
         (select count(*) from information_schema.role_table_grants
           where table_name = 'valuation_requests' and grantee in ('anon','authenticated')) as browser_grants
    from pg_class where relname = 'valuation_requests'
`);
assert.equal(vr.rows[0].relrowsecurity, true, "valuation_requests needs RLS");
assert.equal(Number(vr.rows[0].browser_grants), 0, "anon/authenticated must have no grants");
console.log("✓ valuation_requests: constraints hold, RLS on, browser roles locked out");

// ---- consents + meta leads: separate marketing consent, idempotent leads --
await db.query(
  "insert into consents (email, kind, granted, source, policy_version) values ('first@example.com','privacy_ack',true,'website:valuation','2026-10-19')",
);
await assert.rejects(
  () => db.query("insert into consents (email, kind, granted, policy_version) values ('x@example.com','newsletter',true,'v')"),
  /consents_kind/,
);
const marketing = await db.query(
  "select count(*) from consents where lower(email) = 'first@example.com' and kind = 'marketing_email' and granted",
);
assert.equal(Number(marketing.rows[0].count), 0, "a lead/enquiry alone must never read as marketing consent");

const lead = (id) =>
  db.query(
    "insert into meta_leads (leadgen_id, email, fields, submitted_at, policy_version) values ($1, 'first@example.com', '[]', now(), '2026-10-19')",
    [id],
  );
await lead("L1");
await assert.rejects(() => lead("L1"), /meta_leads_leadgen_id_key/);
const leads = await db.query("select source, policy_version from meta_leads");
assert.equal(leads.rows[0].source, "meta_lead_ads");
assert.equal(leads.rows[0].policy_version, "2026-10-19");

// Erasure: one email, every table.
for (const t of ["waitlist_signups", "valuation_requests", "meta_leads", "consents"]) {
  await db.query(`delete from ${t} where email ilike $1`, ["FIRST@example.com"]);
  const left = await db.query(`select count(*) from ${t} where lower(email) = 'first@example.com'`);
  assert.equal(Number(left.rows[0].count), 0, `${t} must be empty for the erased email`);
}
const priv = await db.query(`
  select relname, relrowsecurity,
         (select count(*) from information_schema.role_table_grants
           where table_name = relname and grantee in ('anon','authenticated')) as browser_grants
    from pg_class where relname in ('consents','meta_leads')
`);
for (const r of priv.rows) {
  assert.equal(r.relrowsecurity, true, `${r.relname} needs RLS`);
  assert.equal(Number(r.browser_grants), 0, `${r.relname}: browser roles must have no grants`);
}
console.log("✓ consents/meta_leads: kinds constrained, leads idempotent, erasure clean, locked down");

console.log("\nALL TESTS PASSED");
