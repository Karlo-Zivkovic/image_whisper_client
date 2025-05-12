export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/5 p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium">Loading payment details...</p>
        </div>
      </div>
    </div>
  );
}
