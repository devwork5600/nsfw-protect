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

export const SubscriptionSuccessTemplate = ({
  username,
  planName,
  amount,
  billingCycle,
  dashboardUrl,
}: {
  username: string;
  planName: string;
  amount: string;
  billingCycle: string;
  dashboardUrl: string;
}) => {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>Subscription Confirmed - Welcome to {planName}!</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px] text-center">
              <Text className="m-0 text-[20px] font-bold uppercase tracking-widest text-[#0070ff]">
                NSFWGuard
              </Text>
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              Payment <strong>Successful</strong>!
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">Hello {username},</Text>
            <Text className="text-[14px] text-black leading-[24px]">
              Thank you for upgrading! Your subscription to the <strong>{planName}</strong> plan is
              now active. You now have full access to all features included in your plan.
            </Text>

            <Section className="mt-[24px] mb-[24px] rounded-lg bg-[#f9f9f9] p-[20px] border border-[#eeeeee] border-solid">
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-[#666666]">
                Subscription Details
              </Text>
              <Hr className="my-[12px] border-[#eeeeee]" />
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">Plan</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{planName}</Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">Amount</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{amount}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text className="m-0 text-[14px] text-[#666666]">Billing Cycle</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{billingCycle}</Text>
              </div>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                href={dashboardUrl}
                className="rounded bg-[#0070ff] px-10 py-3 text-center font-semibold text-[12px] text-white no-underline inline-block"
              >
                Go to Dashboard
              </Link>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              You can manage your subscription, view invoices, and update payment methods at any
              time in your{' '}
              <Link href={`${dashboardUrl}/billing`} className="text-blue-600 no-underline">
                billing settings
              </Link>
              .
            </Text>

            <Hr className="mt-[32px] border-[#eaeaea]" />
            <Text className="mt-[16px] text-[12px] text-[#666666] leading-[24px]">
              If you have any questions about your subscription, please reply to this email or
              contact our support team.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionSuccessTemplate;
