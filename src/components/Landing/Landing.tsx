import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Template from "../Template/Template";
import { Model } from "../Model/Model";

import "./Landing.css";

const duckModels = [
  { url: "/models/leather_duck.glb", description: "Rockstar duck" },
  { url: "/models/mj_duck.glb", description: "King of pop duck" },
  { url: "/models/chinese_duck.glb", description: "Chinese duck" },
];

function Landing() {
  const navigate = useNavigate();
  const [currentDuckIndex, setCurrentDuckIndex] = useState(0);
  const [inputValue, setInputValue] = useState(""); // Add state for input value

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update input value when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue((prev) => prev + " " + transcript);
      resetTranscript();
    }
  }, [listening]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDuckIndex((prevIndex) => (prevIndex + 1) % duckModels.length);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle microphone click
  const handleMicrophoneClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      // Configure continuous listening
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    }
  };
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  if (!browserSupportsSpeechRecognition) {
    console.log("Browser doesn't support speech recognition.");
  }

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
          <div className="prompt-action-button" onClick={handleMicrophoneClick}>
            {listening ? (
              <FontAwesomeIcon
                icon={faMicrophoneSlash}
                id="prompt-action-speech"
              />
            ) : (
              <FontAwesomeIcon icon={faMicrophone} id="prompt-action-speech" />
            )}
          </div>
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
