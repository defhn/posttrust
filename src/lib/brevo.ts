export interface SendEmailParams {
  toEmail: string;
  subject: string;
  htmlContent: string;
  templateId?: number;
  templateParams?: Record<string, string>;
}

export async function sendEmail({
  toEmail,
  subject,
  htmlContent,
  templateId,
  templateParams,
}: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "hello@example.com";
  const senderName = process.env.BREVO_SENDER_NAME || "PostTrust";

  if (!apiKey || apiKey.includes("replace_with")) {
    console.warn("Brevo API Key is not configured. Email not sent.");
    console.log(`--- MOCK EMAIL OUTBOX ---`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${htmlContent}`);
    if (templateParams) {
      console.log(`Params:`, templateParams);
    }
    console.log(`-------------------------`);
    return true; // Return true to prevent blocking development
  }

  try {
    const payload: {
      sender: { name: string; email: string };
      to: Array<{ email: string }>;
      templateId?: number;
      params?: Record<string, string>;
      subject?: string;
      htmlContent?: string;
    } = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail }],
    };

    // If templateId is provided and valid, use Brevo template
    if (templateId && !isNaN(templateId) && templateId > 0) {
      payload.templateId = templateId;
      payload.params = templateParams || {};
    } else {
      payload.subject = subject;
      payload.htmlContent = htmlContent;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Brevo API error: ${response.status} ${errorText}`);
      // Fallback: If template failed, retry with direct HTML
      if (payload.templateId) {
        console.log("Retrying with direct HTML fallback...");
        return sendEmail({ toEmail, subject, htmlContent });
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    return false;
  }
}
