"use client"

export function LogoutLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-12 shadow-2xl animate-scale-in flex flex-col items-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-[#800020] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#800020] animate-pulse">Cerrando sesión</h2>
          <p className="text-gray-600 text-base">Por favor espera un momento...</p>
        </div>
      </div>
    </div>
  )
}
