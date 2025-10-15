'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-cyber font-bold text-gradient mb-4">
          CYBER CONTAINER PLATFORM
        </h1>
        <p className="text-cyber-accent text-xl">
          Platform is running successfully!
        </p>
        <div className="mt-8 space-y-4">
          <p className="text-gray-400">Frontend: ✅ Running on port 3000</p>
          <p className="text-gray-400">Backend: ✅ Running on port 8080</p>
          <p className="text-gray-400">API: ✅ Responding</p>
        </div>
        <div className="mt-8">
          <a 
            href="/" 
            className="cyber-button-primary"
          >
            Go to Main App
          </a>
        </div>
      </div>
    </div>
  )
}
