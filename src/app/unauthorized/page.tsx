export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-6">權限不足</h1>
        <p className="text-gray-400 mb-8">您的 Google 帳號沒有權限使用此系統。</p>
      </div>
    </div>
  );
}