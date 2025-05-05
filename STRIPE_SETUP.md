# Stripe Setup Instructions

This guide will help you set up Stripe payment processing in your Next.js application.

## 1. Create a Stripe Account

If you don't already have a Stripe account, [sign up for one here](https://dashboard.stripe.com/register).

## 2. Get Your API Keys

1. Navigate to the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. You'll need both your Publishable Key and Secret Key
3. For testing, use the test API keys

## 3. Set Up Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following variables:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

Replace `YOUR_PUBLISHABLE_KEY_HERE` and `YOUR_SECRET_KEY_HERE` with your actual Stripe API keys.

## 4. Restart Your Development Server

After setting up your environment variables, restart your Next.js development server:

```bash
npm run dev
```

## 5. Test the Payment Flow

1. Upload an image and enter a prompt
2. Click "Transform My Image" to test the payment flow
3. Use one of Stripe's [test card numbers](https://stripe.com/docs/testing#cards) for testing:
   - `4242 4242 4242 4242` - Successful payment
   - `4000 0000 0000 9995` - Failed payment

## 6. Going to Production

When you're ready to go live:

1. Switch from test API keys to live API keys in your `.env.local` file
2. Update your Stripe account settings in the Stripe Dashboard
3. Ensure your webhook endpoints are properly configured if you're using them
4. Test the entire payment flow thoroughly before launching

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)

# Setting Up Stripe for Testing

This guide explains how to set up and test Stripe payments in your development environment without processing real transactions.

## 1. Stripe Test API Keys

Sign up or log in to [Stripe Dashboard](https://dashboard.stripe.com/) and get your test API keys:

1. Go to Developers → API keys in the Stripe Dashboard
2. Make sure you're in "Test mode" (toggle in the top-right)
3. Copy your "Secret key" and "Publishable key"

In your `.env.local` file, add:

```
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 2. Testing Webhooks Locally

To test webhooks locally, you'll need to use the Stripe CLI:

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login with `stripe login`
3. Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

4. Copy the webhook signing secret displayed after running the command
5. Add to your `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Test Credit Card Numbers

When testing, use these Stripe test card numbers:

- **Success**: 4242 4242 4242 4242
- **Requires Authentication**: 4000 0025 0000 3155
- **Decline**: 4000 0000 0000 0002

For any test card, use:

- Any future expiration date
- Any 3-digit CVC
- Any postal code

## 4. Testing the Payment Flow

1. Start your development server
2. Upload an image and submit a prompt
3. When redirected to the Stripe checkout, use a test card
4. After payment, you'll be redirected back to your success page
5. Check the webhook logs to verify the payment was processed

## 5. Bypassing Stripe in Development (Optional)

If you need to completely bypass Stripe in development for certain scenarios, modify the `create-checkout-session` endpoint to check for a development flag:

```typescript
// In app/api/create-checkout-session/route.ts
export async function POST(request: Request) {
  try {
    // Extract data from the request
    const body = await request.json();
    const { imageId, imagePath, imageUrl, prompt } = body;

    // For development, optionally skip Stripe
    if (process.env.NEXT_PUBLIC_BYPASS_STRIPE === "true") {
      return NextResponse.json({
        url: `${
          request.headers.get("origin") || "http://localhost:3000"
        }/payment-success?session_id=dev_session_${Date.now()}`,
      });
    }

    // Actual Stripe code continues...
    // ...
  } catch (error) {
    // ...
  }
}
```

Add `NEXT_PUBLIC_BYPASS_STRIPE=true` to your `.env.local` to enable this bypass.
