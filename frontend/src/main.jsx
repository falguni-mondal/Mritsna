import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import SmoothScroll from "./configs/SmoothScroll.jsx";
import { IntroProvider } from "./context/IntroContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <SmoothScroll>
        <IntroProvider>
          <App />
        </IntroProvider>
      </SmoothScroll>
    </StrictMode>
  </BrowserRouter>,
);
