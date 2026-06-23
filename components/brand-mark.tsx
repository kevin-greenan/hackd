/* eslint-disable @next/next/no-img-element */

export function BrandMark({
  name,
  logoUrl,
  logoClassName = "h-8 max-w-32"
}: {
  name: string;
  logoUrl?: string;
  logoClassName?: string;
}) {
  return (
    <span className="flex items-center gap-3">
      {logoUrl ? <img alt="" className={`${logoClassName} object-contain`} src={logoUrl} /> : null}
      <span>{name}</span>
    </span>
  );
}
