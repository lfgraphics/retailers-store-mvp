'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-muted-foreground mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window?.location?.reload()}
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
