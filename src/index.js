import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Sepolia } from "@thirdweb-dev/chains";
import { ThirdwebProvider } from "@thirdweb-dev/react";

const activeChain = Sepolia;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain={activeChain}
      clientId={process.env.REACT_APP_TEMPLATE_CLIENT_ID}
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);

reportWebVitals();
