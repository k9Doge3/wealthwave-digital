import Stripe from "stripe";
import https from "https";
import dns from "dns";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  // Prefer IPv4 in serverless environments where IPv6 egress can be flaky.
  // Also keep connections alive to reduce handshake overhead.
  const httpAgent = new https.Agent({
    keepAlive: true,
    lookup: (hostname, _options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
    // Help with occasional transient network issues in serverless.
    timeout: 30_000,
    maxNetworkRetries: 2,
    httpAgent,
  });
}
