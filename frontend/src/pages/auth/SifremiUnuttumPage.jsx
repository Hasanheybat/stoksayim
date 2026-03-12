import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setYukleniyor(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`
    });

    setYukleniyor(false);

    if (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } else {
      setGonderildi(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-soft p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-blue-ink mb-2">Şifremi Unuttum</h2>

        {gonderildi ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-blue-ink font-medium mb-2">E-posta gönderildi!</p>
            <p className="text-gray-500 text-sm mb-6">
              <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
            </p>
            <Link to="/login" className="text-blue-core hover:underline text-sm font-medium">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">
              E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-blue-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-core transition"
              />

              <button
                type="submit"
                disabled={yukleniyor || !email}
                className="w-full py-3 bg-blue-core hover:bg-blue-deep text-white font-semibold rounded-xl transition disabled:opacity-60"
              >
                {yukleniyor ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-blue-core hover:underline">
                ← Geri dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
