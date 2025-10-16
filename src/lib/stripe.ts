import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const getStripePublishableKey = () => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  }
  return process.env.STRIPE_PUBLISHABLE_KEY;
};
