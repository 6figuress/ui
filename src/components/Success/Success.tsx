import { useNavigate } from "react-router-dom";
import Template from "../Template/Template";

import "./Success.css";

function Success() {
  const navigate = useNavigate();

  return (
    <Template>
      <div id="success-wrapper">
        <div id="title-wrapper">
          <h1>Thanks for your order</h1>
          <h1>Further information</h1>
          <h1>via email</h1>
        </div>
        <h4 onClick={() => navigate("/")}>Go back to homepage</h4>
      </div>
    </Template>
  );
}

export default Success;
