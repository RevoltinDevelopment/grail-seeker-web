export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container-custom py-16">
        <div className="text-center">
          <h1 className="mb-4">Stop Searching. Start Finding.</h1>
          <p className="mb-8 text-xl text-slate-700">
            Multi-platform comic book monitoring with SMS alerts
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/login"
              className="rounded-lg bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Login
            </a>
            <a
              href="/register"
              className="rounded-lg border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
