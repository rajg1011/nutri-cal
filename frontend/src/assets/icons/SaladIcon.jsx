const SaladIcon = ({ size = 24, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 11h18" />
    <path d="M5 11c0 4 3 7 7 7s7-3 7-7" />
    <path d="M9 11c0-3 1-5 3-6" />
    <path d="M12 5c2 1 3 3 3 6" />
    <path d="M7 10c0-2 1-3.5 2.5-4" />
    <path d="M15 9.5c.5-1.5 1.5-2.5 2.5-2" />
  </svg>
);

export default SaladIcon;
