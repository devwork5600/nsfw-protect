import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Img,
  Section,
  Text,
  Head,
  Font,
  Tailwind,
} from 'react-email';
import * as React from 'react';

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
    <Html lang="fr">
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                sans: ['Roboto', 'Verdana', 'sans-serif'],
              },
            },
          },
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-10 w-116.25 rounded border border-solid border-[#eaeaea] p-5">
            <Section className="mt-8">
              <Img
                src="https://e5qisws5zl.ufs.sh/f/yLB59fCc10rgKMIkwJzPWzvj05tqHZufhxIiXGCly7bswV21"
                width="40"
                height="37"
                alt="Logo"
                className="mx-auto my-0"
              />
            </Section>

            <Heading className="mx-0 my-7.5 p-0 text-center text-[20px] font-normal text-black">
              Hello <strong>{username}</strong> !
            </Heading>

            <Text className="text-center">{text}</Text>

            <Section className="mt-8 mb-8 text-center">
              <Button
                className="rounded bg-[#3b82f6] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={linkUrl}
              >
                {buttonText}
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;
