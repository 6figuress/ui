import { useEffect, useState, useRef } from "react";
import Template from "../Template/Template";
import "./Loading.css";

interface LoadingProps {
  userPrompt: string;
}

function Loading({ userPrompt }: LoadingProps) {
  const [responseText, setResponseText] = useState("");
  const [fullText, setFullText] = useState("");
  const textBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const streamResponse = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/adventure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_prompt: userPrompt,
          }),
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          try {
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.trim().startsWith("data: ")) {
                const jsonStr = line.replace("data: ", "");
                const jsonData = JSON.parse(jsonStr);
                if (jsonData.text) {
                  accumulatedText += jsonData.text;
                  setFullText(accumulatedText);
                }
              }
            }
          } catch (err) {
            console.error("Error parsing chunk:", err);
          }
        }
      } catch (error) {
        console.error("Error streaming response:", error);
      }
    };

    streamResponse();

    return () => {
      abortController.abort();
    };
  }, [userPrompt]);

  useEffect(() => {
    if (fullText === "") return;

    let currentIndex = responseText.length;

    const intervalId = setInterval(() => {
      if (currentIndex < fullText.length) {
        setResponseText((prevText) => {
          const newText = fullText.slice(0, currentIndex + 1);
          // Force scroll after text update
          requestAnimationFrame(() => {
            if (textBoxRef.current) {
              textBoxRef.current.scrollTop = textBoxRef.current.scrollHeight;
            }
          });
          return newText;
        });
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 100); // You can adjust this value - lower = faster, higher = slower

    return () => clearInterval(intervalId);
  }, [fullText]);

  return (
    <Template>
      <div className="loading-container">
        <div className="loading-content">
          <h1>
            While your ducks are being crafted, let me tell you a story about{" "}
            {userPrompt}
          </h1>
          <div className="loading-text" ref={textBoxRef}>
            {responseText}
          </div>
        </div>
      </div>
    </Template>
  );
}

export default Loading;
