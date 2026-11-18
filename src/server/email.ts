export type EmailSender = {
  send(message: { to: string; subject: string; text: string }): Promise<{ delivered: boolean; error?: string }>;
};

export function createEmailSender(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): EmailSender {
  return {
    async send(message) {
      if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        return { delivered: false, error: "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM." };
      }
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text }),
      });
      if (!response.ok) return { delivered: false, error: "The email provider rejected the message." };
      return { delivered: true };
    },
  };
}
