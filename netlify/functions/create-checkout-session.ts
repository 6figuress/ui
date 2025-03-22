import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import * as nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// More detailed transporter setup
const createTransporter = () => {
  console.log("Creating email transporter...");
  console.log("GMAIL_USER:", process.env.GMAIL_USER);
  console.log("GMAIL_APP_PASSWORD exists:", !!process.env.GMAIL_APP_PASSWORD);

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    debug: true,
  });
};

const sendConfirmationEmail = async (
  email: string,
  sessionId: string,
  description: string,
) => {
  console.log("Attempting to send confirmation email...");

  const transporter = createTransporter();

  try {
    await transporter.verify();
    console.log("Transporter verified successfully");

    const mailOptions = {
      from: `"6figures" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Duck Order Confirmation",
      text: `Thank you for your order!

Order Details:
Session ID: ${sessionId}
Duck Description: ${description}

We'll process your order as soon as possible and keep you updated on its status.

Best regards,
The duckers @ 6figures`,
      html: `
        <h2>Thank you for your order!</h2>
        <h3>Order Details:</h3>
        <p><strong>Session ID:</strong> ${sessionId}</p>
        <p><strong>Duck Description:</strong> ${description}</p>
        <p>We'll process your order as soon as possible and keep you updated on its status.</p>
        <br>
        <p>Best regards,<br>The duckers @ 6figures</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const { email, duckUrl, description } = JSON.parse(event.body || "{}");

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
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.URL || "http://localhost:5173"}/success`,
      cancel_url: `${process.env.URL || "http://localhost:5173"}`,
      customer_email: email,
    });

    // Save the order to Notion
    await fetch(`${process.env.URL}/.netlify/functions/save-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        encodedGlbData: duckUrl,
        sessionId: session.id,
        description,
      }),
    });

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, session.id, description);
      console.log("Confirmation email sent successfully");
    } catch (emailError) {
      console.error("Detailed email error:", emailError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };
