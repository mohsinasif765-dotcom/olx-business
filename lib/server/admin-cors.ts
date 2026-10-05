export function adminCors(request: Request, methods: string) {
  const origin = request.headers.get("origin") || "";
  const allow = new Set(
    [
      process.env.ADMIN_ORIGIN,
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://olx-business-admin.vercel.app",
    ].filter(Boolean) as string[]
  );
  return {
    "Access-Control-Allow-Origin": allow.has(origin) ? origin : process.env.ADMIN_ORIGIN || "http://localhost:3001",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, x-olx-ops",
  };
}
