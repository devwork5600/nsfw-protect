import {
  Body,
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
  Hr,
} from 'react-email';
import { logoUrl } from './logo-url.js';

export const PlanUpdatedTemplate = ({
  username,
  oldPlanName,
  newPlanName,
  effectiveDate,
  dashboardUrl,
  changeType,
  newPrice,
}: {
  username: string;
  oldPlanName: string;
  newPlanName: string;
  effectiveDate: string;
  dashboardUrl: string;
  changeType: 'upgrade' | 'downgrade' | 'update';
  newPrice?: string;
}) => {
  const title =
    changeType === 'upgrade'
      ? 'Upgrade Confirmed'
      : changeType === 'downgrade'
        ? 'Plan Downgraded'
        : 'Plan Updated';

  const message =
    changeType === 'upgrade' ? (
      <>
        Great news! You&apos;ve successfully upgraded your account to the{' '}
        <strong>{newPlanName}</strong> plan.
      </>
    ) : changeType === 'downgrade' ? (
      <>
        Your plan has been changed to <strong>{newPlanName}</strong>. This change will be reflected
        in your next billing cycle.
      </>
    ) : (
      <>
        Your subscription has been updated to the <strong>{newPlanName}</strong> plan.
      </>
    );

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{title} - NSFWGuard</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={logoUrl()}
                width="200"
                height="44"
                alt="NSFWGuard"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              Plan{' '}
              <strong>
                {changeType === 'upgrade'
                  ? 'Upgraded'
                  : changeType === 'downgrade'
                    ? 'Downgraded'
                    : 'Updated'}
              </strong>
              !
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">Hello {username},</Text>
            <Text className="text-[14px] text-black leading-[24px]">{message}</Text>

            <Section className="mt-[24px] mb-[24px] rounded-lg bg-[#f9f9f9] p-[20px] border border-[#eeeeee] border-solid">
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-wider text-[#666666]">
                Change Summary
              </Text>
              <Hr className="my-[12px] border-[#eeeeee]" />
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">Previous Plan</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{oldPlanName}</Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <Text className="m-0 text-[14px] text-[#666666]">New Plan</Text>
                <Text className="m-0 text-[14px] font-medium text-[#16a34a]">{newPlanName}</Text>
              </div>
              {newPrice && (
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
                >
                  <Text className="m-0 text-[14px] text-[#666666]">New Price</Text>
                  <Text className="m-0 text-[14px] font-medium text-black">{newPrice}</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text className="m-0 text-[14px] text-[#666666]">Effective Date</Text>
                <Text className="m-0 text-[14px] font-medium text-black">{effectiveDate}</Text>
              </div>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                href={dashboardUrl}
                className="rounded bg-[#0070ff] px-10 py-3 text-center font-semibold text-[12px] text-white no-underline inline-block"
              >
                View Dashboard
              </Link>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              You can check your new limits and manage your API keys in your{' '}
              <Link href={`${dashboardUrl}/usage`} className="text-blue-600 no-underline">
                usage dashboard
              </Link>
              .
            </Text>

            <Hr className="mt-[32px] border-[#eaeaea]" />
            <Text className="mt-[16px] text-[12px] text-[#666666] leading-[24px]">
              If you didn't authorize this change, please contact our support team immediately.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PlanUpdatedTemplate;
