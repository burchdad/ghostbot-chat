// Initial Stripe setup
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, tier = 'basic' } = req.body;

  try {
    const prices = {
      basic: 'price_ABC123',    // Replace with your real Stripe Price IDs
      pro: 'price_DEF456',
      enterprise: 'price_GHI789'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: prices[tier],
          quantity: 1
        }
      ],
      success_url: `${process.env.BASE_URL}/onboarding?status=success`,
      cancel_url: `${process.env.BASE_URL}/onboarding?status=cancelled`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment session failed' });
  }
}
