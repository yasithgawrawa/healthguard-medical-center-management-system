import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HealthGuard Application Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div style={{
            maxWidth: "520px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #fee2e2",
            boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.1), 0 8px 10px -6px rgba(239, 68, 68, 0.1)",
            padding: "28px",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
              Something went wrong in this workspace
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
              A temporary issue occurred while rendering this interface. Please try refreshing the workspace.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "10px 14px",
                fontSize: "0.8rem",
                color: "#dc2626",
                fontFamily: "monospace",
                textAlign: "left",
                marginBottom: "20px",
                overflowX: "auto"
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="button-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="button-primary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
