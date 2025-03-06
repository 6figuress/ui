import { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, duckUrl } = JSON.parse(event.body || "{}");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Duck Model",
              description: "Custom 3D Duck Model",
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.URL || "http://localhost:5173"}/success`,
      cancel_url: `${process.env.URL || "http://localhost:5173"}/order`,
      customer_email: email,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }), // Note: changed 'id' to 'sessionId'
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create checkout session" }),
    };
  }
};

export { handler };
