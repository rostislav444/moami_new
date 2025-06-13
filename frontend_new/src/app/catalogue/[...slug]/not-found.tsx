import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fefcf7' }}>
      <div className="text-center">
        <h1 className="text-6xl font-thin text-amber-900 mb-4 font-serif">404</h1>
        <h2 className="text-2xl font-light text-amber-800 mb-6 font-serif">
          Категорію не знайдено
        </h2>
        <p className="text-amber-700/70 mb-8 font-light">
          Вибачте, але запитувана категорія не існує або була видалена.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-amber-800 text-white font-light tracking-wide hover:bg-amber-900 transition-colors duration-300 font-serif"
            style={{ letterSpacing: '0.05em' }}
          >
            На головну
          </Link>
          <Link 
            href="/catalogue"
            className="inline-block px-6 py-3 border border-amber-800 text-amber-800 font-light tracking-wide hover:bg-amber-50 transition-colors duration-300 font-serif"
            style={{ letterSpacing: '0.05em' }}
          >
            До каталогу
          </Link>
        </div>
      </div>
    </div>
  )
} 