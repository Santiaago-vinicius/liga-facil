import { AppError } from './errors';

export async function sendMail(to: string, subject: string, html: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.log(`\n[E-MAIL para ${to}] ${subject}\n${html}\n`);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'LigaFácil', email: process.env.MAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    throw new AppError(502, 'Não foi possível enviar o e-mail agora');
  }
}