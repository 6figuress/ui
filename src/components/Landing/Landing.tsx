import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import { createSpeechServicesPonyfill } from "web-speech-cognitive-services";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Template from "../Template/Template";
import { Model } from "../Model/Model";

import "./Landing.css";

// Get Azure credentials from environment variables
const SUBSCRIPTION_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

// Initialize Azure Speech Services if credentials are available
let AzureSpeechRecognition;
if (SUBSCRIPTION_KEY && REGION) {
  const { SpeechRecognition: AzurePolyfill } = createSpeechServicesPonyfill({
    credentials: {
      region: REGION,
      subscriptionKey: SUBSCRIPTION_KEY,
    },
  });
  AzureSpeechRecognition = AzurePolyfill;
  SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
}

const duckModels = [
  { url: "/models/leather_duck.glb", description: "Rockstar duck" },
  { url: "/models/mj_duck.glb", description: "King of pop duck" },
  { url: "/models/chinese_duck.glb", description: "Chinese duck" },
  { url: "/models/police_duck.glb", description: "Police duck" },
  { url: "/models/swiss_duck.glb", description: "Swiss duck" },
];

function Landing() {
  const navigate = useNavigate();
  const [currentDuckIndex, setCurrentDuckIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    commands: [],
    clearTranscriptOnListen: true,
  });

  // Update input value whenever transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript); // Replace the text instead of appending
    }
  }, [transcript]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDuckIndex((prevIndex) => (prevIndex + 1) % duckModels.length);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  const handleMicrophoneClick = async () => {
    if (listening) {
      await SpeechRecognition.stopListening();
    } else {
      try {
        setInputValue(""); // Clear input when starting new recording
        resetTranscript(); // Reset transcript when starting new recording
        await SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
          interimResults: true, // Enable interim results for more responsive recognition
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsSpeechSupported(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Check if speech recognition is supported and microphone is available
  useEffect(() => {
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
      setIsSpeechSupported(false);
      console.log(
        "Speech recognition not supported or microphone not available",
      );
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  const currentDuck = duckModels[currentDuckIndex];

  return (
    <Template>
      <div id="title-wrapper">
        <h1>Order your duck</h1>
        <h1>Right now</h1>
      </div>
      <Model modelUrl={currentDuck.url} description={currentDuck.description} />
      <div id="prompt-input-wrapper">
        <div id="prompt-input">
          <input
            type="text"
            placeholder="Describe your desired duck"
            value={inputValue}
            onChange={handleInputChange}
          />
        </div>
        <div id="prompt-action-buttons">
          {isSpeechSupported && (
            <div
              className="prompt-action-button"
              onClick={handleMicrophoneClick}
              title={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? (
                <FontAwesomeIcon
                  icon={faMicrophoneSlash}
                  id="prompt-action-speech"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faMicrophone}
                  id="prompt-action-speech"
                />
              )}
            </div>
          )}
          <div
            className="prompt-action-button"
            id="prompt-action-proceed"
            onClick={() => navigate("/exhibit")}
          >
            +
          </div>
        </div>
      </div>
    </Template>
  );
}

export default Landing;
