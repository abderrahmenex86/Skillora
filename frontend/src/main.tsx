import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { useThemeStore } from './store/useThemeStore';
import './index.css';

try {
    useThemeStore.getState().initTheme();
} catch {
    // Ignore unreadable persisted theme; fall back to the light palette.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
