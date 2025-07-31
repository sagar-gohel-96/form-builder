import { BrowserRouter, Route, Routes } from "react-router-dom";
import FormBuilder from "./components/FormBuilder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
