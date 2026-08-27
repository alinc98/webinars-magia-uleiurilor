import Image from 'next/image'

/**
 * Imaginile din Storage se servesc ca atare, fără optimizator.
 *
 * Sunt deja WebP, decupate și la dimensiunea finală, din momentul încărcării în
 * admin. Trecerea lor prin optimizatorul Vercel ar consuma din plafonul lunar
 * al planului gratuit fără să scadă nimic — exact ce încercăm să evităm
 * (PLAN.md §2.4).
 */
export function Poza({
  src,
  alt,
  latime,
  inaltime,
  className,
  priority,
}: {
  src: string
  alt: string
  latime: number
  inaltime: number
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={latime}
      height={inaltime}
      className={className}
      priority={priority}
      unoptimized
    />
  )
}
