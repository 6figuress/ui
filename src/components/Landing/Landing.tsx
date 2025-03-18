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
import { storeDuckData } from "../../utils/indexedDB";

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
  { url: "/models/mudry_duck.glb", description: "??? duck" },
];

function Landing() {
  const navigate = useNavigate();
  const [currentDuckIndex, setCurrentDuckIndex] = useState(
    Math.floor(Math.random() * duckModels.length),
  );
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

  const cleanupSpeechRecognition = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
  };

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDuckIndex((prevIndex) => (prevIndex + 1) % duckModels.length);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      cleanupSpeechRecognition();
    };
  }, []);

  useEffect(() => {
    const handleSpeechEnd = () => {
      if (listening) {
        cleanupSpeechRecognition();
      }
    };

    window.addEventListener("speechend", handleSpeechEnd);

    return () => {
      window.removeEventListener("speechend", handleSpeechEnd);
    };
  }, [listening]);

  const handleMicrophoneClick = async () => {
    if (listening) {
      cleanupSpeechRecognition();
    } else {
      try {
        setInputValue("");
        resetTranscript();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
          interimResults: true,
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsSpeechSupported(false);
        cleanupSpeechRecognition();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
      setIsSpeechSupported(false);
      console.log(
        "Speech recognition not supported or microphone not available",
      );
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  const handleProceed = async () => {
    if (!inputValue.trim()) {
      return;
    }

    try {
      const requests = Array(4)
        .fill(null)
        .map(() =>
          fetch("http://127.0.0.1:5000/api/texture", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ user_prompt: inputValue }),
            mode: "cors",
          }),
        );

      const responses = await Promise.all(requests);
      const jsonData = await Promise.all(responses.map((res) => res.json()));
      const duckData = jsonData.map((data) => data.glb_data);

      // Store data in IndexedDB
      await storeDuckData({
        ducks: duckData,
        prompt: inputValue,
      });

      navigate("/exhibit");
    } catch (error) {
      console.error("Error generating ducks:", error);
    }
  };

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
            onClick={handleProceed}
          >
            +
          </div>
        </div>
      </div>
    </Template>
  );
}

export default Landing;
