import { Component, type ReactNode } from "react";
import { reloadOnce } from "../lib/reload";

/**
 * Catches a page that fails to load or render, so the site's chrome and the
 * transition stay up instead of the whole root unmounting. It reloads once
 * (see reloadOnce); after that the page area stays empty.
 */
export default class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    reportError(error);
    reloadOnce();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
