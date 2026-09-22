import { lookup } from "node:dns/promises";
import { get } from "node:https";
import ipaddr from "ipaddr.js";
import { SearchError } from "./search.ts";

export function publicUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SearchError("Enter a complete public HTTPS listing URL.", 400);
  }
  if (
    input.length > 2000 ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new SearchError(
      "Use a public HTTPS listing URL without credentials or a custom port.",
      400,
    );
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !host.includes(".") ||
    /\.(localhost|local|internal|test|invalid)$/.test(host) ||
    (ipaddr.isValid(host) && !publicAddress(host))
  )
    throw new SearchError("Private or reserved addresses cannot be read.", 400);
  url.hash = "";
  return url;
}
export function publicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}
export async function resolvePublic(input: string, resolver = lookup) {
  const url = publicUrl(input);
  const addresses = await resolver(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new SearchError("Private or reserved addresses cannot be read.", 400);
  return { url, address: addresses[0] };
}
// Resolve every redirect, then pin that vetted address to the socket. No cookies,
// credentials, proxy headers or user-provided request headers are forwarded.
export async function fetchPage(
  input: string,
  deadline = Date.now() + 12000,
  redirects = 0,
): Promise<{ html: string; url: string }> {
  if (redirects > 3)
    throw new SearchError("The listing redirected too many times.", 422);
  const remaining = deadline - Date.now();
  if (remaining <= 0)
    throw new SearchError("The listing took too long to respond.", 504);
  const resolved = await Promise.race([
    resolvePublic(input),
    new Promise<never>((_, reject) => {
      const t = setTimeout(
        () =>
          reject(new SearchError("The listing took too long to respond.", 504)),
        remaining,
      );
      t.unref();
    }),
  ]);
  const { url, address } = resolved;
  const result = await new Promise<{ html?: string; redirect?: string }>(
    (resolve, reject) => {
      const req = get(
        url,
        {
          agent: false,
          family: address.family,
          lookup: (_host, _options, callback) =>
            callback(null, address.address, address.family),
          headers: {
            "User-Agent":
              "BoatUneet-ListingLab/1.0 (+https://www.boatuneet.com/lab)",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Encoding": "identity",
          },
        },
        (res) => {
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode ?? 0) &&
            res.headers.location
          ) {
            res.destroy();
            try {
              resolve({ redirect: new URL(res.headers.location, url).href });
            } catch {
              reject(new SearchError("The listing returned an invalid redirect.", 422));
            }
            return;
          }
          if (res.statusCode !== 200) {
            res.destroy();
            reject(
              new SearchError(
                "This website did not allow the listing to be read. Paste its details instead; no access restrictions were bypassed.",
                422,
              ),
            );
            return;
          }
          if (
            !/text\/html|application\/xhtml\+xml/.test(
              res.headers["content-type"] ?? "",
            ) ||
            (res.headers["content-encoding"] &&
              res.headers["content-encoding"] !== "identity")
          ) {
            res.destroy();
            reject(
              new SearchError(
                "This page is not a supported HTML listing.",
                422,
              ),
            );
            return;
          }
          let size = 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > 2_000_000) {
              req.destroy(
                new SearchError(
                  "This page is too large to read safely. Paste the listing details instead.",
                  422,
                ),
              );
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () =>
            resolve({ html: Buffer.concat(chunks).toString("utf8") }),
          );
          res.on("error", reject);
        },
      );
      const timer = setTimeout(
        () =>
          req.destroy(
            new SearchError("The listing took too long to respond.", 504),
          ),
        Math.max(1, deadline - Date.now()),
      );
      req.on("close", () => clearTimeout(timer));
      req.on("error", reject);
    },
  );
  if (result.redirect)
    return fetchPage(result.redirect, deadline, redirects + 1);
  return { html: result.html ?? "", url: url.href };
}
