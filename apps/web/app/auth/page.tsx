'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, MailIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FcGoogle } from 'react-icons/fc';
import { authClient } from '@/lib/auth/auth-client';
import { ForceField } from '@/components/canvasui/ForceField';
import SocialButton from './social-button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { MagicLinkSignInSchema, MagicLinkSignInSchemaType } from '@/lib/validators/email-schemas';

export default function AuthPage() {
  const [socialLoading, setSocialLoading] = useState(false);

  const form = useForm<MagicLinkSignInSchemaType>({
    resolver: zodResolver(MagicLinkSignInSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    formState: { isSubmitting },
  } = form;

  const authLoading = isSubmitting || socialLoading;

  /* ================= MAGIC LINK ================= */

  const onSubmit = async (values: MagicLinkSignInSchemaType) => {
    try {
      await authClient.signIn.magicLink(
        { email: values.email },
        {
          onSuccess: () => {
            toast.success('A magic link has been sent to your email.');
          },
          onError: (ctx) => {
            setError('email', {
              message: ctx.error?.message || 'Failed to send the link.',
            });
          },
        },
      );
    } catch {
      setError('email', {
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  /* ================= OAUTH ================= */

  const handleProviderSignIn = async (provider: 'google' | 'github') => {
    try {
      setSocialLoading(true);

      await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + '/dashboard',
      });
      // ⛔ nothing after this line will be seen
    } catch {
      setSocialLoading(false);
      setError('root', {
        message: 'Unable to sign in.',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background relative overflow-hidden">
      <ForceField
        style={{ position: 'absolute', inset: 0 }}
        shape="hexagon"
        color={[0.15, 0.68, 1]}
        cellScale={13}
        gridReveal="always"
        gridOpacity={0.2}
        hoverGlow={0}
        hoverCharge={0}
        clickRipples={false}
        refraction={0}
        opacity={0.35}
      >
        <></>
      </ForceField>

      {/* Left panel (Marketing) */}
      <div className="hidden md:flex md:w-1/2 p-12 lg:p-24 flex-col justify-between relative z-10 overflow-hidden border-r border-border">
        <Link href={'/'} className="flex gap-2">
          <ArrowLeftIcon />
          Back
        </Link>
        <div>
          <Link href="/" className="font-bold text-2xl flex items-center gap-2 mb-16">
            <Shield className="w-8 h-8 text-primary" />
            NSFWGuard
          </Link>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold tracking-tighter leading-[1.1] text-foreground">
              Secure content moderation at scale.
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed">
              Our high-performance API detects and filters explicit content with 99.9% accuracy
              using advanced neural networks.
            </p>
          </div>
        </div>

        <div className="flex gap-6 text-sm font-heading font-bold tracking-widest uppercase text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
        </div>
      </div>

      {/* Right panel (Auth Form) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-24 bg-card relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden flex flex-col items-center mb-12">
          <Link
            href="/"
            className="font-heading font-bold text-2xl tracking-tighter flex items-center gap-2 mb-4"
          >
            <Shield className="w-8 h-8 text-primary" />
            NSFWGuard
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8 border border-border rounded-lg p-8">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tighter text-foreground mb-2">
              Welcome
            </h2>
            <p className="text-muted-foreground text-sm font-sans">
              Secure your instance with API-level integrity.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={`space-y-5 ${authLoading ? 'pointer-events-none' : ''}`}
            noValidate
          >
            {form.formState.errors.root && (
              <div className="bg-destructive/15 border-destructive/20 text-destructive rounded-md border p-3 text-sm font-medium">
                {form.formState.errors.root.message}
              </div>
            )}
            {/* EMAIL FIELD */}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email address</FieldLabel>

                  <div className="relative">
                    <MailIcon className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="Email address"
                      className="pl-12 border-border"
                      disabled={authLoading}
                      aria-invalid={fieldState.invalid}
                    />
                  </div>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* SUBMIT */}
            <Button type="submit" disabled={authLoading} className="w-full">
              {authLoading ? 'Sending...' : 'Send me a Magic Link'}
            </Button>

            {/* DIVIDER */}
            <div className="text-muted-foreground flex items-center py-5 text-sm">
              <div className="flex-1 border-t" />
              <span className="px-3">or</span>
              <div className="flex-1 border-t" />
            </div>

            {/* SOCIAL */}
            <div className="space-y-2">
              <SocialButton
                provider="google"
                icon={<FcGoogle size={22} />}
                label="Continue with Google"
                onClick={() => handleProviderSignIn('google')}
                disabled={authLoading}
              />

              <SocialButton
                provider="github"
                icon={<FaGithub size={22} />}
                label="Continue with GitHub"
                onClick={() => handleProviderSignIn('github')}
                disabled={authLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
