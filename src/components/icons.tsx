// Inline SVG icons, copied path-for-path from the original pages.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const BackIcon = (p: IconProps) => (
  <Svg size={16} {...p}>
    <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg size={16} {...p}>
    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg size={16} {...p}>
    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HamburgerIcon = (p: IconProps) => (
  <Svg size={17} {...p}>
    <path d="M4 6.5H20M4 12H20M4 17.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const BellIcon = (p: IconProps) => (
  <Svg size={17} {...p}>
    <path
      d="M12 4C8.5 4 6.5 6.5 6.5 10C6.5 14.5 4.5 15.5 4.5 17C4.5 17.6 5 18 5.5 18H18.5C19 18 19.5 17.6 19.5 17C19.5 15.5 17.5 14.5 17.5 10C17.5 6.5 15.5 4 12 4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M10 20.5C10.4 21.2 11.1 21.6 12 21.6C12.9 21.6 13.6 21.2 14 20.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg size={15} {...p}>
    <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg size={15} {...p}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M20 20L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const ChatBubbleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M4 5.5C4 4.7 4.7 4 5.5 4H18.5C19.3 4 20 4.7 20 5.5V15.5C20 16.3 19.3 17 18.5 17H9L5 20.5V17H5.5C4.7 17 4 16.3 4 15.5V5.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CameraIcon = ({ strokeWidth = 1.6, ...p }: IconProps) => (
  <Svg {...p}>
    <path
      d="M4 8.5C4 7.4 4.9 6.5 6 6.5H8L9 5H15L16 6.5H18C19.1 6.5 20 7.4 20 8.5V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V8.5Z"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth={strokeWidth} />
  </Svg>
);

export const PaperclipIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M17 8L9.5 15.5C8.4 16.6 6.6 16.6 5.5 15.5C4.4 14.4 4.4 12.6 5.5 11.5L13.5 3.5C14.9 2.1 17.1 2.1 18.5 3.5C19.9 4.9 19.9 7.1 18.5 8.5L11 16C10.3 16.7 9.2 16.7 8.5 16C7.8 15.3 7.8 14.2 8.5 13.5L15 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BarcodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5V19M8 5V19M11 5V19M15 5V19M17 5V19M20 5V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

export const CalculatorIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 7.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8.3" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="15.7" cy="12" r="1" fill="currentColor" />
    <circle cx="8.3" cy="15.7" r="1" fill="currentColor" />
    <circle cx="12" cy="15.7" r="1" fill="currentColor" />
    <circle cx="15.7" cy="15.7" r="1" fill="currentColor" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Svg size={15} {...p}>
    <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MicIcon = (p: IconProps) => (
  <Svg size={16} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" stroke="white" strokeWidth="1.7" />
    <path d="M6 11.5C6 15 8.7 17.5 12 17.5C15.3 17.5 18 15 18 11.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12 17.5V21" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
  </Svg>
);

export const SendPlaneIcon = (p: IconProps) => (
  <Svg size={15} {...p}>
    <path d="M20 12L4 4L7 12L4 20L20 12Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="white" />
  </Svg>
);

export const WarningIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 9V13.5M12 17H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M10.3 4.3L2.8 17.5C2.3 18.4 3 19.5 4 19.5H20C21 19.5 21.7 18.4 21.2 17.5L13.7 4.3C13.2 3.4 12 3.4 10.3 4.3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BoxIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M4 8.5C4 7.7 4.5 7 5.3 6.7L11.3 4.3C11.7 4.1 12.3 4.1 12.7 4.3L18.7 6.7C19.5 7 20 7.7 20 8.5V16C20 16.8 19.5 17.5 18.7 17.8L12.7 20.2C12.3 20.4 11.7 20.4 11.3 20.2L5.3 17.8C4.5 17.5 4 16.8 4 16V8.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M4.5 7.5L12 11L19.5 7.5M12 11V20.3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </Svg>
);

export const BankIcon = ({ strokeWidth = 1.7, ...p }: IconProps) => (
  <Svg size={22} {...p}>
    <path d="M3 10L12 4L21 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 10V19M9 10V19M15 10V19M19.5 10V19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M3 19H21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const SignOutIcon = (p: IconProps) => (
  <Svg size={20} {...p}>
    <path
      d="M15 8V6C15 4.9 14.1 4 13 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H13C14.1 20 15 19.1 15 18V16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M9 12H21M21 12L17.5 8.5M21 12L17.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const FlashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </Svg>
);

export const GalleryIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
    <path d="M4 17L9 12L13 15L16 12L20 16" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </Svg>
);

export const SparkIcon = (p: IconProps) => (
  <Svg size={72} {...p}>
    <path d="M6 12.5C6 9 8.5 6.5 12 6.5C15.5 6.5 18 9 18 12.5C18 15.5 15.8 17.5 12 17.5" stroke="#0F5D46" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12.5" r="2" fill="#22C55E" />
  </Svg>
);
