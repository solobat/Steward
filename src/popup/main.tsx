import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../popup.css";

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
          <p style={{ margin: 0 }}>Steward 加载异常，请关闭后重试或刷新页面。</p>
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
