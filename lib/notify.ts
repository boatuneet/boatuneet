/** Internal "new valuation request" email via Resend's HTTP API.
 *  Server-only. Silent no-op until RESEND_API_KEY is set, so the signup
 *  itself never depends on it. */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function notifyNewLead(subject: string, rows: Record<string, string | number | boolean | null | undefined>) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_EMAIL ?? "boat@you-neet.com";
  const from = process.env.NOTIFY_FROM ?? "BoatUneet <onboarding@resend.dev>";
  const trs = Object.entries(rows)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${esc(k)}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`)
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: typeof rows.Email === "string" ? rows.Email : undefined,
      subject,
      html: `<table style="font:14px -apple-system,Segoe UI,sans-serif;border-collapse:collapse">${trs}</table>`,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
