import { z } from "zod";
export const contactSchema = z.object({ name: z.string().trim().min(1, "Please enter your name").max(100), email: z.string().trim().email("Please enter a valid email").max(255), message: z.string().trim().min(1, "Please enter your message").max(2000) });
export function contactMailto(recipient: string, input: unknown) {
  const email = z.string().email().max(255).parse(recipient);
  const data = contactSchema.parse(input);
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`U M Collection enquiry from ${data.name}`)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
}