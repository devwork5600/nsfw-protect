import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  pixelBasedPreset,
  Hr,
} from 'react-email';

export const SupportRequestTemplate = ({
  name,
  email,
  category,
  subject,
  message,
}: {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>New support request: {subject}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[520px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              New <strong>Support Request</strong>
            </Heading>

            <Section className="mt-[24px] mb-[24px] rounded-lg bg-[#f9f9f9] p-[20px] border border-[#eeeeee] border-solid">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">From</Text>
                <Text className="m-0 text-[14px] font-medium text-black">
                  {name} ({email})
                </Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">Category</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{category}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text className="m-0 text-[14px] text-[#666666]">Subject</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{subject}</Text>
              </div>
            </Section>

            <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-[#666666]">
              Message
            </Text>
            <Hr className="my-[12px] border-[#eeeeee]" />
            <Text className="text-[14px] text-black leading-[24px] whitespace-pre-wrap">
              {message}
            </Text>

            <Hr className="mt-[32px] border-[#eaeaea]" />
            <Text className="mt-[16px] text-[12px] text-[#666666] leading-[24px]">
              Reply directly to this email to respond to{' '}
              <Link href={`mailto:${email}`} className="text-blue-600 no-underline">
                {email}
              </Link>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SupportRequestTemplate;
