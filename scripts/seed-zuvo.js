const { createClient } = require("@supabase/supabase-js");

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const plans = [
  { id: "new-city", name: "City sedan", kind: "new", invest: "$100 – $199", returns: "$3.00", term: "30 days", image: "/cars/city-sedan.jpg", enabled: true },
  { id: "new-family", name: "Family SUV", kind: "new", invest: "$200 – $499", returns: "$24.00", term: "90 days", image: "/cars/family-suv.jpg", enabled: true },
  { id: "new-exec", name: "Executive", kind: "new", invest: "$500 – $1,999", returns: "$60.00", term: "150 days", image: "/cars/executive.jpg", enabled: true },
  { id: "new-luxe", name: "Luxury", kind: "new", invest: "$2,000 – $4,999", returns: "$360.00", term: "180 days", image: "/cars/luxury.jpg", enabled: true },
  { id: "used-compact", name: "Certified compact", kind: "used", invest: "$100 – $199", returns: "$3.00", term: "30 days", image: "/cars/used-compact.jpg", enabled: true },
  { id: "used-sedan", name: "Certified sedan", kind: "used", invest: "$200 – $499", returns: "$24.00", term: "90 days", image: "/cars/used-sedan.jpg", enabled: true },
  { id: "used-suv", name: "Certified SUV", kind: "used", invest: "$500 – $1,999", returns: "$60.00", term: "150 days", image: "/cars/used-suv.jpg", enabled: true },
  { id: "used-premium", name: "Certified premium", kind: "used", invest: "$2,000 – $4,999", returns: "$360.00", term: "180 days", image: "/cars/used-premium.jpg", enabled: true },
];

(async () => {
  const a = await s.from("car_packages").upsert(plans);
  if (a.error) throw a.error;
  const snap = await s.from("ops_snapshot").upsert({
    id: 1,
    payload: { seeded: true, vips: plans.map((p) => ({ id: p.id, name: p.name, range: p.invest, income: p.returns, days: Number(p.term.split(" ")[0]), kind: p.kind, image: p.image, enabled: true })) },
    updated_at: new Date().toISOString(),
  });
  if (snap.error) throw snap.error;
  const count = await s.from("car_packages").select("id", { count: "exact", head: true });
  console.log("seeded packages", count.count);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
