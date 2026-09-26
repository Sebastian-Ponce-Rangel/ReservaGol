'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Ingresa un correo válido.';
    }
    if (!password.trim()) {
      nextErrors.password = 'La contraseña es obligatoria.';
    }

    setErrors(nextErrors);
    setAuthError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TODO: conectar con la API real
    if (email.trim().toLowerCase() === 'demo@reservagol.com' && password === 'demo1234') {
      router.push('/reservas');
      return;
    }

    setAuthError('Correo o contraseña incorrectos');
    setIsSubmitting(false);
  }

  return (
    <main className="page-shell login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <a className="login-brand" href="/" aria-label="ReservaGol, inicio">
          <span className="login-brand-mark" aria-hidden="true">RG</span>
          <span>ReservaGol</span>
        </a>

        <div className="login-heading">
          <span className="login-eyebrow">Tu próximo partido empieza aquí</span>
          <h1 id="login-title">Bienvenido de vuelta</h1>
          <p>Inicia sesión para gestionar tus reservas deportivas.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <span className="login-error" id="email-error">{errors.email}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Escribe tu contraseña"
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password && <span className="login-error" id="password-error">{errors.password}</span>}
          </div>

          <div className="login-forgot-row">
            <a href="#" onClick={(event) => event.preventDefault()}>Olvidé mi contraseña</a>
          </div>

          {authError && <p className="login-auth-error" role="alert">{authError}</p>}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-footer">Reserva tu cancha. Vive el partido.</p>
      </section>
    </main>
  );
}