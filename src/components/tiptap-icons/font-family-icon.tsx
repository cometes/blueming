import { forwardRef } from "react"

export const FontFamilyIcon = forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 20V4h8a4 4 0 1 1 0 8H4" />
    <path d="M12 12h4a4 4 0 1 1 0 8h-4" />
  </svg>
))

FontFamilyIcon.displayName = "FontFamilyIcon"