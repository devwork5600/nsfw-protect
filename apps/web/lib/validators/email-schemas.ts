import { z } from "zod";

export const MagicLinkSignInSchema = z.object({
  email: z.string().email("Must be a valid email"),
});

export type MagicLinkSignInSchemaType = z.infer<typeof MagicLinkSignInSchema>;



