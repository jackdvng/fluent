interface FluentLogoProps {
  size?: number;
  className?: string;
}

export default function FluentLogo({ size = 64, className = "" }: FluentLogoProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl shadow-[0_6px_20px_rgba(255,103,102,0.35),0_2px_8px_rgba(202,40,81,0.15)] ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "#FF6766",
      }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 10C8 6.686 10.686 4 14 4H28C31.314 4 34 6.686 34 10V22C34 25.314 31.314 28 28 28H18L10 36V28H14C10.686 28 8 25.314 8 22V10Z"
          fill="white"
        />
        <path d="M20 13L28 18L20 23V13Z" fill="#FF6766" />
      </svg>
    </div>
  );
}
