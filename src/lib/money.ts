export function formatMoney(cents: number, _currency: string) {
  // Site UX requirement: display prices as simple "$" amounts.
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString("en-US")}`;
}
