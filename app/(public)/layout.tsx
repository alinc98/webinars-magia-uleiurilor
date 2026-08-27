import { FurnizorConsimtamant } from '@/components/public/consimtamant'
import { FooterPublic } from '@/components/public/footer'

/**
 * Bannerul de cookie-uri și footerul legal trăiesc aici, deci acoperă toate
 * paginile publice — dar nu și panoul de administrare.
 */
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <FurnizorConsimtamant>
      <div className="flex min-h-svh flex-col">
        <div className="flex-1">{children}</div>
        <FooterPublic />
      </div>
    </FurnizorConsimtamant>
  )
}
