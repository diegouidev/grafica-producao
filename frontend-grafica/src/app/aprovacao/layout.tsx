// src/app/aprovacao/layout.tsx
// (Novo Arquivo)

import { Inter } from "next/font/google";
import "../globals.css"; // Importa o CSS global
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Aprovação de Arte - Cloud Gráfica",
  description: "Portal de aprovação de arte.",
};

export default function AprovacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-100`}>
        {/* Este é um layout simples, sem o Sidebar ou o AuthProvider */}
        <main>{children}</main>
        
        {/* Adicionamos o ToastContainer aqui também */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}