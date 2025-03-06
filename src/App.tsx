import { Routes, Route } from "react-router-dom";
import Landing from "./components/Landing/Landing";
import Exhibit from "./components/Exhibit/Exhibit";
import Order from "./components/Order/Order";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/exhibit" element={<Exhibit />} />
      <Route path="/order" element={<Order />} />
    </Routes>
  );
}

export default App;
