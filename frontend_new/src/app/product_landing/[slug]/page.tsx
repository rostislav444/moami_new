interface LandingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LandingPage({ params }: LandingPageProps) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 to-white">
      <div className="max-w-4xl mx-auto px-8 py-24">
        <h1 className="text-4xl font-thin tracking-wide text-amber-900 mb-8 font-serif text-center">
          Landing Page
        </h1>
        <p className="text-amber-800/70 text-lg font-light text-center">
          Slug: {resolvedParams.slug}
        </p>
      </div>
    </div>
  );
} 