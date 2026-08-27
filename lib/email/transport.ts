import 'server-only'

import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export type Atasament = {
  filename: string
  content: string
  contentType: string
}

export type MesajEmail = {
  to: string
  subject: string
  html: string
  text: string
  attachments?: Atasament[]
  headers?: Record<string, string>
}

/**
 * Două căi de livrare, aleasă după mediu:
 *
 * - `RESEND_API_KEY` setat → Resend, adică producția.
 * - altfel → SMTP spre Mailpit-ul din stack-ul Supabase local, unde emailurile
 *   se văd în browser fără să plece nicăieri.
 *
 * Diferența e izolată aici. Restul codului trimite fără să știe pe unde pleacă.
 */
export async function trimiteEmail(
  mesaj: MesajEmail
): Promise<{ ok: true; providerId: string | null } | { ok: false; error: string }> {
  const from = process.env.EMAIL_FROM ?? 'Magia Uleiurilor <contact@localhost>'
  const apiKey = process.env.RESEND_API_KEY

  try {
    if (apiKey) {
      const resend = new Resend(apiKey)
      const { data, error } = await resend.emails.send({
        from,
        to: mesaj.to,
        subject: mesaj.subject,
        html: mesaj.html,
        text: mesaj.text,
        headers: mesaj.headers,
        attachments: mesaj.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString('base64'),
          contentType: a.contentType,
        })),
      })

      if (error) return { ok: false, error: error.message }
      return { ok: true, providerId: data?.id ?? null }
    }

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? '127.0.0.1',
      port: Number(process.env.SMTP_PORT ?? 54325),
      secure: false,
      tls: { rejectUnauthorized: false },
    })

    const info = await transport.sendMail({
      from,
      to: mesaj.to,
      subject: mesaj.subject,
      html: mesaj.html,
      text: mesaj.text,
      headers: mesaj.headers,
      attachments: mesaj.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    return { ok: true, providerId: info.messageId ?? null }
  } catch (eroare) {
    return { ok: false, error: eroare instanceof Error ? eroare.message : 'eroare necunoscută' }
  }
}
