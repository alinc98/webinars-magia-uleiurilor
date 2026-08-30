import { FurnizorConsimtamant } from '@/components/public/consimtamant'
import { FooterPublic } from '@/components/public/footer'
import { GA4 } from '@/components/public/ga4'
import { MetaPixel } from '@/components/public/meta-pixel'

/**
 * Bannerul de cookie-uri și footerul legal trăiesc aici, deci acoperă toate
 * paginile publice — dar nu și panoul de administrare.
 */
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <FurnizorConsimtamant>
      <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      <GA4 id={process.env.NEXT_PUBLIC_GA4_ID} />
      <div className="flex min-h-svh flex-col">
        <div className="flex-1">{children}</div>
        <FooterPublic />
      </div>
    </FurnizorConsimtamant>
  )
}
