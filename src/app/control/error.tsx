"use client";
import Link from "next/link";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="control-main" className="control-login">
      <h1>Panel vaqtincha ochilmadi.</h1>
      <p>Tahrirlaringizni o‘zgartirmasdan, qayta urinib ko‘ring.</p>
      <button onClick={reset}>Qayta urinish</button>
      <Link href="/uz">Saytga qaytish</Link>
    </main>
  );
}
