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
import { shieldUrl } from './logo-url.js';

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
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Sign in to NSFW Protect</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-8">
              <table role="presentation" align="center" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle', paddingRight: 8 }}>
                      <Img src={shieldUrl()} width="28" height="34" alt="" />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Text className="m-0 font-bold text-[22px] text-black leading-[34px]">
                        NSFW Protect
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
            <Heading className="mx-0 my-7.5 p-0 text-center font-normal text-[24px] text-black">
              Welcome back, <strong>{username}</strong>!
            </Heading>
            <Text className="text-[14px] text-black leading-6">Hello {username},</Text>
            <Text className="text-[14px] text-black leading-6">{text}</Text>
            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-[#0070ff] px-6 py-3 text-center font-semibold text-[12px] text-white no-underline"
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
