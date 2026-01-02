'use client';

import { useState } from "react";
import { PLACEHOLDER } from "@/lib/cardArtRegistry";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export function CardArt({ src, alt, className = "" }: Props) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER);
  const [didFallback, setDidFallback] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (didFallback) return;
        setDidFallback(true);
        setImgSrc(PLACEHOLDER);
      }}
    />
  );
}
