export type ShopKind = "jewelry" | "electronics";

export type ShopPlan = {
  id: string;
  kind: ShopKind;
  name: string;
  invest: string;
  returns: string;
  term: string;
  image: string;
};

export function shopKind(value: unknown): ShopKind {
  return value === "electronics" ? "electronics" : "jewelry";
}
