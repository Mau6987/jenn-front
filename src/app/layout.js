import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "./componentes/navbar"
import { Inter } from "next/font/google"
import { AuthProvider } from "../contexts/auth-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <main className="flex-1 p-6 bg-gray-50">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
