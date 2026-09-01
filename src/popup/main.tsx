import React from "react";
import ReactDOM from "react-dom/client";
import { t } from "@/lib/i18n";
import App from "./App";
import "../popup.css";
import "../shared/appearance.css";

class ErrorFallback extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  componentDidCatch() {}
  render() {
    if (this.state.hasError)
      return (
        <div style={{ padding: 16, background: "#fff", minHeight: "100%", fontSize: 14 }}>
          <p style={{ margin: 0 }}>{t("popup_error")}</p>
        </div>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorFallback>
      <App />
    </ErrorFallback>
  </React.StrictMode>
);
