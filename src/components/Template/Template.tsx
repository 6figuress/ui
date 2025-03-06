import Footer from "../Footer/Footer";
import { ReactNode } from "react";
import "./Template.css";

function Template({ children }: { children: ReactNode }) {
  return (
    <div id="wrapper">
      <div id="inner-wrapper">{children}</div>
      <Footer />
    </div>
  );
}

export default Template;
