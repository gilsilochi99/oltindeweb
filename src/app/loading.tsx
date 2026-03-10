
export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background text-foreground">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
      </div>
      <div className="text-center mt-6">
        <h2 className="text-2xl font-bold font-headline">Oltinde</h2>
        <p className="text-muted-foreground mt-2">Espera...</p>
      </div>
    </div>
  );
}
