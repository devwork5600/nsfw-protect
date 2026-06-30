import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  pixelBasedPreset,
} from 'react-email';

export const EmailTemplate = ({
  username,
  linkUrl,
  text,
  buttonText,
}: {
  username: string;
  linkUrl: string;
  text: string;
  buttonText: string;
}) => {
  const rawBaseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return (
    <Html lang="en">
      <Head />
      <Preview>Sign in to NSFWGuard</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 max-w-116.25 rounded border border-[#eaeaea] border-solid p-5">
            <Section className="mt-8">
              <Img
                src={
                  baseUrl === 'http://localhost:3000'
                    ? `${baseUrl}/shield.png`
                    : 'https://app.nsfw-protect.com/shield.png'
                }
                width="40"
                height="40"
                alt="NSFWGuard Logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
              Welcome back, <strong>{username}</strong>!
            </Heading>
            <Text className="text-[14px] text-black leading-6">Hello {username},</Text>
            <Text className="text-[14px] text-black leading-6">{text}</Text>
            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href={linkUrl}
              >
                {buttonText}
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-6">
              or copy and paste this URL into your browser:{' '}
              <Link href={linkUrl} className="text-blue-600 no-underline">
                {linkUrl}
              </Link>
            </Text>
            <Text className="mt-6 text-[12px] text-[#666666] leading-6">
              This link will expire in 1 hour. If you did not request this email, you can safely
              ignore it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;
