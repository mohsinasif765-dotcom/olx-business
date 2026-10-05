export function CoinIcon({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    className: "shrink-0",
  };

  switch (symbol) {
    case "USDT":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#26a17b" />
          <path fill="#fff" d="M17.3 14.2v8.2h-2.6v-8.2H9.2v-2.2h13.6v2.2h-5.5z" />
          <path fill="#fff" d="M16 8.4c-3.4 0-6.1.7-6.1 1.6s2.7 1.6 6.1 1.6 6.1-.7 6.1-1.6-2.7-1.6-6.1-1.6z" />
        </svg>
      );
    case "USDC":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#2775ca" />
          <circle cx="16" cy="16" r="11" fill="none" stroke="#fff" strokeWidth="1.6" />
          <path
            fill="#fff"
            d="M17.2 10.2V8.6h-2.4v1.6c-2.2.3-3.6 1.6-3.6 3.5 0 2.2 1.6 3.2 3.6 3.6v4.1c-1-.2-1.8-.8-2.2-1.6l-2.1.8c.7 1.6 2.3 2.7 4.3 3v1.6h2.4v-1.6c2.3-.3 3.8-1.7 3.8-3.7 0-2.3-1.6-3.3-3.8-3.7v-3.9c.9.2 1.6.7 1.9 1.4l2.1-.7c-.6-1.5-2-2.5-4-2.8zm-2.4 5.2c-1-.2-1.6-.7-1.6-1.4s.6-1.2 1.6-1.4v2.8zm2.4 6.3c1.1.2 1.8.8 1.8 1.6s-.8 1.3-1.8 1.4v-3z"
          />
        </svg>
      );
    case "TRX":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#eb0029" />
          <path fill="#fff" d="M8.2 8.8 23.6 11.4 16.4 24.2 8.2 8.8zm3.3 1.8 4.5 9.1 4.8-8.4-9.3-.7z" />
        </svg>
      );
    case "BNB":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#f3ba2f" />
          <path
            fill="#fff"
            d="M16 7.2 18.7 10 16 12.7 13.3 10 16 7.2zm-6.3 6.3L12.4 16l-2.7 2.7L7 16l2.7-2.5zm12.6 0L25 16l-2.7 2.7-2.7-2.7 2.7-2.5zM16 19.3l2.7 2.7L16 24.8l-2.7-2.8L16 19.3zm0-6.1 2.5 2.5L16 18.2l-2.5-2.5L16 13.2z"
          />
        </svg>
      );
    case "ETH":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#627eea" />
          <path fill="#fff" d="M16 6.4 16.1 16.2 23.3 13 16 6.4z" opacity=".85" />
          <path fill="#fff" d="M16 6.4 8.7 13 15.9 16.2 16 6.4z" />
          <path fill="#fff" d="M16.1 17.4 16 25.6 23.3 14.4 16.1 17.4z" opacity=".85" />
          <path fill="#fff" d="M16 25.6V17.4L8.7 14.4 16 25.6z" />
        </svg>
      );
    case "POL":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#8247e5" />
          <path
            fill="#fff"
            d="M20.6 10.2 16 7.6l-4.6 2.6v5.3l4.6 2.7 4.6-2.7v-5.3zm-4.6 6.4-2.8-1.6v-3.2L16 10.2l2.8 1.6v3.2L16 16.6zM11.4 17.4v2.4L16 22.4l4.6-2.6v-2.4L16 19.8l-4.6-2.4z"
          />
        </svg>
      );
    case "PYUSD":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#003087" />
          <circle cx="16" cy="16" r="11.4" fill="#009cde" />
          <path
            fill="#fff"
            d="M13.2 10.2h4.1c2.4 0 3.7 1.2 3.7 3.2 0 2.2-1.6 3.4-4 3.4h-1.4V21h-2.4V10.2zm2.4 4.6h1.3c.9 0 1.5-.5 1.5-1.3s-.6-1.3-1.5-1.3h-1.3v2.6z"
          />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#4f5dff" />
        </svg>
      );
  }
}
