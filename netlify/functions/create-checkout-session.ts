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
  // Don't log the full password, just check if it exists
  console.log("GMAIL_APP_PASSWORD exists:", !!process.env.GMAIL_APP_PASSWORD);

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    debug: true, // Enable debug logging
  });
};

const sendConfirmationEmail = async (
  email: string,
  sessionId: string,
  duckUrl: string,
) => {
  console.log("Attempting to send confirmation email...");

  const transporter = createTransporter();

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log("Transporter verified successfully");
  } catch (verifyError) {
    console.error("Transporter verification failed:", verifyError);
    throw verifyError;
  }

  const mailOptions = {
    from: `"6figures" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Duck Order Confirmation",
    text: `Thank you for your order!

Order Details:
Session ID: ${sessionId}
Model URL: ${duckUrl}

We'll process your order as soon as possible and keep you updated on its status.

Best regards,
The duckers @ 6figures`,
    html: `
      <h2>Thank you for your order!</h2>
      <h3>Order Details:</h3>
      <p><strong>Session ID:</strong> ${sessionId}</p>
      <p><strong>Model URL:</strong> ${duckUrl}</p>
      <p>We'll process your order as soon as possible and keep you updated on its status.</p>
      <br>
      <p>Best regards,<br>The duckers @ 6figures</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (sendError) {
    console.error("Failed to send email:", sendError);
    throw sendError;
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
        duckUrl,
        sessionId: session.id,
      }),
    });

    // Send confirmation email with detailed error handling
    try {
      await sendConfirmationEmail(email, session.id, duckUrl);
      console.log("Confirmation email sent successfully");
    } catch (emailError) {
      console.error("Detailed email error:", emailError);
      // You might want to log this to a monitoring service
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
