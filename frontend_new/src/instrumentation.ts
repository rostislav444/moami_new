export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Catch uncaught exceptions to prevent process crash
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception (handled):', error.message)
      // Don't exit - let the server continue running
    })

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection (handled):', reason)
      // Don't exit - let the server continue running
    })
  }
}
