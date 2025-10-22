import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "../components/ui/sidebar"
import Navbar from "./componentes/navbar"
import AppSidebar from "./componentes/sidebar"
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
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-6 bg-gray-50">{children}</main>
              </div>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
