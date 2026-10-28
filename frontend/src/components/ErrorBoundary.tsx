import { Component, type ErrorInfo, type ReactNode } from 'react';
import { queryClient } from '../api/queryClient';
import { classifyError } from '../lib/errors';
import ErrorScreen from './ErrorScreen';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: unknown;
}

export default class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(
            '[Skillora] Unhandled UI error:',
            error,
            info.componentStack
        );
    }

    private handleRetry = () => {
        queryClient.invalidateQueries();
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { hasError, error } = this.state;

        if (hasError) {
            return (
                <ErrorScreen
                    kind={classifyError(error)}
                    error={error}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}
