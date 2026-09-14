import { Component, type ErrorInfo, type ReactNode } from "react";
import "./CargaPantalla.css";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error en la aplicación:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="carga-pantalla carga-pantalla--completa">
          <h1 style={{ margin: 0, fontSize: "1.15rem" }}>Algo falló al cargar</h1>
          <p className="carga-pantalla__texto">{this.state.error.message}</p>
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
