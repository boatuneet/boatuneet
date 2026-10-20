/** Internal "new valuation request" email. Server-only.
 *  Provider is whichever key is set: BREVO_API_KEY (single-sender
 *  verification, no DNS needed) or RESEND_API_KEY. Silent no-op without
 *  either, so the signup itself never depends on it. */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function notifyNewLead(subject: string, rows: Record<string, string | number | boolean | null | undefined>) {
  const brevo = process.env.BREVO_API_KEY;
  const resend = process.env.RESEND_API_KEY;
  if (!brevo && !resend) return;

  const to = process.env.NOTIFY_EMAIL ?? "boat@you-neet.com";
  // "Name <address>" or a bare address.
  const rawFrom = process.env.NOTIFY_FROM ?? (brevo ? to : "BoatUneet <onboarding@resend.dev>");
  const m = rawFrom.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
  const from = { name: m?.[1]?.trim() || "BoatUneet", email: (m?.[2] ?? rawFrom).trim() };
  const replyTo = typeof rows.Email === "string" ? rows.Email : undefined;

  const trs = Object.entries(rows)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${esc(k)}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`)
    .join("");
  const html = `<table style="font:14px -apple-system,Segoe UI,sans-serif;border-collapse:collapse">${trs}</table>`;

  const res = brevo
    ? await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevo, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: from,
          to: [{ email: to }],
          replyTo: replyTo ? { email: replyTo } : undefined,
          subject,
          htmlContent: html,
        }),
      })
    : await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${from.name} <${from.email}>`, to: [to], reply_to: replyTo, subject, html }),
      });
  if (!res.ok) throw new Error(`${brevo ? "brevo" : "resend"} ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
