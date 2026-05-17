"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/auth-session";
import { prisma } from "@nsfw/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

import { manageSubscription } from "./subscription";

export async function createCheckoutSession(
  priceId: string
) {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const customer = await prisma.customer.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  // If user already has an active subscription, manage it instead of creating a new one
  if (customer?.subscriptions.length) {
    return await manageSubscription(priceId);
  }

  // Create Stripe customer once
  let stripeCustomerId = customer?.stripeCustomerId;
  
  if (!customer) {
    const stripeCustomer =
      await stripe.customers.create({
        email: user.email,
        name: `${user.name}`,
      });

    const newCustomer = await prisma.customer.create({
      data: {
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
      },
    });
    stripeCustomerId = newCustomer.stripeCustomerId;
  } else {
    stripeCustomerId = customer.stripeCustomerId;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session =
    await stripe.checkout.sessions.create({
      mode: "subscription",

      customer: stripeCustomerId,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url:
        `${baseUrl}/dashboard/billing?success=1`,

      cancel_url:
        `${baseUrl}/billing?canceled=1`,
    });

  redirect(session.url!);
}