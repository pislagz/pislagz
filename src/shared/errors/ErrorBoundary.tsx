"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { showErrorPopup } from "./show-error-popup";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    showErrorPopup(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, color: "white", textAlign: "center" }}>
          <p>Something went wrong. Refresh the page to continue.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
