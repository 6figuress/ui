import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Template from "../Template/Template";
import { Model } from "../Model/Model";
import "./Order.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface OrderLocationState {
  selectedDuckUrl: string;
  selectedDuckDescription: string;
}

function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderLocationState;
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && emailInput && !isLoading) {
      handleOrderSubmit();
    }
  };

  const handleOrderSubmit = async () => {
    if (!isValidEmail(emailInput)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      // Create checkout session
      const response = await fetch(
        "/.netlify/functions/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailInput,
            duckUrl: state?.selectedDuckUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Template onBackClick={() => navigate(-1)}>
      <div id="title-wrapper">
        <h1>Please confirm</h1>
        <h1>your order</h1>
      </div>
      <Model
        modelUrl={state?.selectedDuckUrl}
        description={state?.selectedDuckDescription}
      />
      <div id="prompt-input-wrapper">
        <div id="prompt-input">
          <input
            type="email"
            placeholder="Please provide your email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginTop: "5px" }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
      <div id="order-actions">
        <div
          id="order-action"
          className={!emailInput || isLoading ? "disabled" : ""}
          onClick={handleOrderSubmit}
        >
          {isLoading ? "Loading..." : "Proceed with payment"}
        </div>
        <div id="exhibit-actions" onClick={() => navigate(-1)}>
          <h4>Go back</h4>
        </div>
      </div>
    </Template>
  );
}

export default Order;
