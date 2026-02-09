"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-950">
          <div className="mx-auto flex max-w-md flex-col items-center text-center px-4">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Critical Error
            </h1>
            <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Something went very wrong!
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-gray-500 dark:text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
