import Image from "next/image";

const LOGO_SRC = "/uploads/logo/bluufun.png";

// https://res.cloudinary.com/dwzznea6l/image/upload/v1783388212/bluufun_nf1fqu.png

interface BrandLogoProps {
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export default function BrandLogo({
  width,
  height,
  priority = false,
  className = "",
  imgClassName = "",
  alt = "Bluufun logo",
}: BrandLogoProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`.trim()}
      style={{ width, height }}>
      <Image
        src={LOGO_SRC}
        alt={alt}
        fill
        priority={priority}
        sizes={`${width}px`}
        className={`object-contain ${imgClassName}`.trim()}
      />
    </span>
  );
}
