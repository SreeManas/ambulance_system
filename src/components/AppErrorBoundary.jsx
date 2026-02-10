import React from 'react';

/**
 * AppErrorBoundary — Global crash protection for EMS Router
 * Wraps all major dashboards to prevent full-app crashes.
 * MF10: Provides graceful recovery UI instead of white screen.
 */
class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('🚨 AppErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <span className="text-white text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            System Recovering
                        </h2>
                        <p className="text-gray-600 mb-6">
                            A component encountered an error. Your data is safe.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                            >
                                Refresh Page
                            </button>
                        </div>
                        {this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-red-600 overflow-auto max-h-32 border border-gray-200">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack?.slice(0, 500)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
