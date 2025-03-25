import Footer from "../Footer/Footer";
import { ReactNode } from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Template.css";

interface TemplateProps {
  children: ReactNode;
  onBackClick?: () => void;
}

function Template({ children, onBackClick }: TemplateProps) {
  return (
    <div id="wrapper">
      {onBackClick && (
        <FontAwesomeIcon
          icon={faArrowLeft}
          onClick={onBackClick}
          id="back-action"
        />
      )}
      <div id="inner-wrapper">{children}</div>
      <Footer />
    </div>
  );
}

export default Template;
