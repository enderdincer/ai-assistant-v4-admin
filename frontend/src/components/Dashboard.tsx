/**
 * Dashboard - Main dashboard layout displaying all services.
 */

import { useServiceHealth } from '../hooks/useServiceHealth';
import { ServiceCard } from './ServiceCard';
import { ConnectionStatus } from './ConnectionStatus';

export function Dashboard() {
  const { services, connectionStatus, reconnect } = useServiceHealth();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                AI Assistant v4
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Service Health Dashboard
              </p>
            </div>
            <ConnectionStatus status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {connectionStatus === 'connecting' && services.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4" />
              <p className="text-gray-400">Connecting to server...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {connectionStatus === 'connected' && services.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">📡</div>
              <h3 className="text-lg font-medium text-white mb-2">
                No Services Detected
              </h3>
              <p className="text-gray-400 max-w-md">
                Waiting for services to publish their health status. Make sure
                the AI Assistant v4 services are running and publishing to MQTT.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {connectionStatus === 'error' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                Connection Error
              </h3>
              <p className="text-gray-400 max-w-md mb-4">
                Unable to connect to the backend server. Please check that the
                server is running.
              </p>
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Service grid */}
        {services.length > 0 && (
          <>
            {/* Summary stats */}
            <div className="mb-8 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-gray-400">
                  Healthy:{' '}
                  <span className="text-white font-medium">
                    {services.filter((s) => s.status === 'healthy').length}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-gray-400">
                  Unhealthy:{' '}
                  <span className="text-white font-medium">
                    {services.filter((s) => s.status === 'unhealthy').length}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-500" />
                <span className="text-gray-400">
                  Unknown:{' '}
                  <span className="text-white font-medium">
                    {services.filter((s) => s.status === 'unknown').length}
                  </span>
                </span>
              </div>
            </div>

            {/* Service cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            AI Assistant v4 Admin Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}
