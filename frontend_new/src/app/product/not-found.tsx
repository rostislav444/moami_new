import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fefcf7' }}>
      <div className="text-center">
        <h1 className="text-6xl font-thin text-amber-900 mb-4 font-serif">404</h1>
        <h2 className="text-2xl font-light text-amber-800 mb-6 font-serif">
          Товар не знайдено
        </h2>
        <p className="text-amber-700/70 mb-8 max-w-md">
          На жаль, запитуваний товар не існує або був видалений. 
          Перейдіть до каталогу, щоб переглянути всі доступні товари.
        </p>
        <Link 
          href="/"
          className="inline-block bg-amber-800 text-white px-8 py-3 font-light tracking-wide hover:bg-amber-900 transition-colors duration-300 font-serif"
        >
          До каталогу
        </Link>
      </div>
    </div>
  )
} 