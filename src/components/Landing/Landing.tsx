import { useState, useEffect } from "react";
import Template from "../Template/Template";
import Model from "../Model/Model";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

import "./Landing.css";

const duckModels = [
  { url: "/models/leather_duck.glb", description: "Rockstar duck" },
  { url: "/models/mj_duck.glb", description: "King of pop duck" },
];

function Landing() {
  // State to keep track of the
  // current duck model index
  const [currentDuckIndex, setCurrentDuckIndex] = useState(0);

  // Effect to switch the duck
  // model every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Move to the next duck model
      // (cycling back to the first when reaching the end)
      setCurrentDuckIndex((prevIndex) => (prevIndex + 1) % duckModels.length);
    }, 10000);

    // Clean up the interval when
    // the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  // Get the current duck model data
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
          <input type="text" placeholder="Describe your desired duck" />
        </div>
        <div id="prompt-action-buttons">
          <div className="prompt-action-button">
            <FontAwesomeIcon icon={faMicrophone} id="prompt-action-speech" />
          </div>
          <div className="prompt-action-button" id="prompt-action-proceed">
            +
          </div>
        </div>
      </div>
    </Template>
  );
}

export default Landing;
