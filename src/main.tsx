import "@ant-design/v5-patch-for-react-19";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { antdTheme } from "./theme/antdTheme";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import ScrollToTop from "./components/ScrollToTop";
import "antd/dist/reset.css";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter>
        <ScrollToTop />
        <AntApp>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AntApp>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);