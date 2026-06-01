import Image from "next/image";

type EvidenceImageProps = {
  alt: string;
  caption: string;
  className?: string;
  height: number;
  imageClassName?: string;
  sizes: string;
  src: string;
  width: number;
};

export function EvidenceImage({
  alt,
  caption,
  className = "",
  height,
  imageClassName = "",
  sizes,
  src,
  width,
}: EvidenceImageProps) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
      <Image
        alt={alt}
        className={`h-auto w-full object-cover ${imageClassName}`}
        height={height}
        sizes={sizes}
        src={src}
        width={width}
      />
      <figcaption className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500">
        {caption}
      </figcaption>
    </figure>
  );
}
