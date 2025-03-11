import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import TemplateSelection from "./components/TemplateSelection";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<TemplateSelection />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
