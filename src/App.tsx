import { Routes, Route } from "react-router-dom";
import Landing from "./components/Landing/Landing";
import Exhibit from "./components/Exhibit/Exhibit";
import Order from "./components/Order/Order";
import Success from "./components/Success/Success";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/exhibit" element={<Exhibit />} />
      <Route path="/order" element={<Order />} />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}

export default App;
