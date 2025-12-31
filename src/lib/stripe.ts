import Stripe from "stripe";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
    // Help with occasional transient network issues in serverless.
    timeout: 30_000,
    maxNetworkRetries: 2,
    // Use fetch-based transport (works well in serverless/edge-like environments).
    httpClient: Stripe.createFetchHttpClient(),
  });
}
