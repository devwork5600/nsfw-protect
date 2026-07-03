'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitSupportRequest } from '@/actions/support';

const CATEGORIES = ['Technical Issue', 'Billing Inquiry', 'Feature Request', 'General Question'];

const fieldClass =
  'rounded-none border-border bg-transparent focus-visible:ring-primary/40 focus-visible:border-primary';

export function SupportForm({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [category, setCategory] = useState('General Question');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result = await submitSupportRequest(formData);
      if (result.success) {
        toast.success(result.message);
        setSent(true);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="p-8 border border-primary/30 bg-primary/5 space-y-2">
        <h3 className="font-bold uppercase tracking-tighter text-primary">Message sent</h3>
        <p className="text-sm text-muted-foreground">
          Thanks for reaching out — our team will get back to you at the email address you provided.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={defaultName}
            placeholder="Jane Doe"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder="jane@company.com"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full rounded-none border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            required
            placeholder="e.g. API latency issue"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          placeholder="Describe your issue in detail..."
          className={`min-h-40 ${fieldClass}`}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-none font-bold uppercase tracking-widest py-6"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
      </Button>
    </form>
  );
}
