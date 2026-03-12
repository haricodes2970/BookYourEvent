import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950 p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
