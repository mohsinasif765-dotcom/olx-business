export function BrandLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt="OLX Business"
      width={size}
      height={size}
      className={`brand-logo shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
