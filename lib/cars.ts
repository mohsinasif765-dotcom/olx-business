export type CarKind = "new" | "used";

export type CarPlan = {
  id: string;
  kind: CarKind;
  name: string;
  invest: string;
  returns: string;
  term: string;
  image: string;
};

export const CAR_PLANS: CarPlan[] = [
  {
    id: "new-city",
    kind: "new",
    name: "City sedan",
    invest: "$100 – $199",
    returns: "$3.00",
    term: "30 days",
    image: "/cars/city-sedan.jpg",
  },
  {
    id: "new-family",
    kind: "new",
    name: "Family SUV",
    invest: "$200 – $499",
    returns: "$24.00",
    term: "90 days",
    image: "/cars/family-suv.jpg",
  },
  {
    id: "new-exec",
    kind: "new",
    name: "Executive",
    invest: "$500 – $1,999",
    returns: "$60.00",
    term: "150 days",
    image: "/cars/executive.jpg",
  },
  {
    id: "new-luxe",
    kind: "new",
    name: "Luxury",
    invest: "$2,000 – $4,999",
    returns: "$360.00",
    term: "180 days",
    image: "/cars/luxury.jpg",
  },
  {
    id: "used-compact",
    kind: "used",
    name: "Certified compact",
    invest: "$100 – $199",
    returns: "$3.00",
    term: "30 days",
    image: "/cars/used-compact.jpg",
  },
  {
    id: "used-sedan",
    kind: "used",
    name: "Certified sedan",
    invest: "$200 – $499",
    returns: "$24.00",
    term: "90 days",
    image: "/cars/used-sedan.jpg",
  },
  {
    id: "used-suv",
    kind: "used",
    name: "Certified SUV",
    invest: "$500 – $1,999",
    returns: "$60.00",
    term: "150 days",
    image: "/cars/used-suv.jpg",
  },
  {
    id: "used-premium",
    kind: "used",
    name: "Certified premium",
    invest: "$2,000 – $4,999",
    returns: "$360.00",
    term: "180 days",
    image: "/cars/used-premium.jpg",
  },
];

/** Used by recharge flow (`?plan=`). */
export const VIP_PLANS = CAR_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  recharge: plan.invest,
}));
