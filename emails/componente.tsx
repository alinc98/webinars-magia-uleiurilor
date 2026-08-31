import { LINKURI } from '@/lib/linkuri'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'react-email'

/** Culorile din brief §13. Emailurile nu moștenesc CSS-ul paginii. */
export const culori = {
  fundal: '#F8F5EF',
  card: '#FFFFFF',
  text: '#26292A',
  discret: '#6B6F70',
  verde: '#2E4B3C',
  accent: '#C9714F',
  bordura: '#E5E0D6',
}

const stiluri = {
  body: {
    backgroundColor: culori.fundal,
    color: culori.text,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: '24px 0',
  },
  container: {
    backgroundColor: culori.card,
    border: `1px solid ${culori.bordura}`,
    borderRadius: '14px',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '32px',
  },
  text: { fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' },
  discret: {
    color: culori.discret,
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
  },
  titlu: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: '1.3',
    margin: '0 0 16px',
  },
  buton: {
    backgroundColor: culori.accent,
    borderRadius: '10px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 600,
    padding: '14px 28px',
    textDecoration: 'none',
  },
}

export function Sablon({
  preview,
  children,
  unsubscribeUrl,
}: {
  preview: string
  children: React.ReactNode
  /**
   * Doar la emailurile de promovare. Pe o confirmare sau pe o reamintire,
   * linkul ar minți: dezabonarea nu opreşte accesul la un eveniment la care
   * omul s-a înscris deja.
   */
  unsubscribeUrl?: string
}) {
  return (
    <Html lang="ro">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={stiluri.body}>
        <Container style={stiluri.container}>
          {children}

          <Hr style={{ borderColor: culori.bordura, margin: '28px 0 16px' }} />
          <Text style={stiluri.discret}>
            Magia Uleiurilor Esențiale · Andreea Gligor ·{' '}
            <Link
              href={LINKURI.confidentialitate}
              style={{ color: culori.discret }}
            >
              Politica de confidențialitate
            </Link>
          </Text>
          <Text style={stiluri.discret}>
            Primești acest mesaj pentru că te-ai înscris la unul dintre
            evenimentele noastre.
          </Text>
          {unsubscribeUrl && (
            <Text style={stiluri.discret}>
              Nu mai vrei să primești astfel de mesaje?{' '}
              <Link href={unsubscribeUrl} style={{ color: culori.discret }}>
                Dezabonează-te
              </Link>
              .
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

export function Titlu({ children }: { children: React.ReactNode }) {
  return <Text style={stiluri.titlu}>{children}</Text>
}

/** Titlu de bloc în interiorul emailului: „Adaugă în calendar", „Informații utile". */
export function Subtitlu({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ ...stiluri.text, fontWeight: 700, margin: '26px 0 6px' }}>
      {children}
    </Text>
  )
}

export function Paragraf({ children }: { children: React.ReactNode }) {
  return <Text style={stiluri.text}>{children}</Text>
}

export function Discret({ children }: { children: React.ReactNode }) {
  return <Text style={stiluri.discret}>{children}</Text>
}

export function Buton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Section style={{ margin: '24px 0' }}>
      <Link href={href} style={stiluri.buton}>
        {children}
      </Link>
    </Section>
  )
}

/** Blocul de detalii: etichetă în stânga, valoare în dreapta. */
export function Detalii({ randuri }: { randuri: [string, string][] }) {
  return (
    <Section
      style={{
        backgroundColor: culori.fundal,
        borderRadius: '10px',
        margin: '20px 0',
        padding: '16px 20px',
      }}
    >
      {/* Cheia poartă şi indicele: la un program pe zile, două etichete pot
          coincide dacă cineva le scrie la fel în admin. */}
      {randuri.map(([eticheta, valoare], i) => (
        <Text
          key={`${eticheta}-${i}`}
          style={{ fontSize: '15px', lineHeight: '1.6', margin: '0 0 6px' }}
        >
          <span style={{ color: culori.discret }}>{eticheta}: </span>
          <strong>{valoare}</strong>
        </Text>
      ))}
    </Section>
  )
}
