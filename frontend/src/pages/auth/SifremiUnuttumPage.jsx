import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function SifremiUnuttumPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white-soft p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-blue-ink mb-2">Şifremi Unuttum</h2>

        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <p className="text-gray-700 font-medium mb-2">Şifre sıfırlama işlemi için</p>
          <p className="text-gray-500 text-sm mb-6">
            Lütfen sistem yöneticinize başvurun.<br />
            Yöneticiniz şifrenizi sıfırlayabilir.
          </p>
          <Link
            to="/app-login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
