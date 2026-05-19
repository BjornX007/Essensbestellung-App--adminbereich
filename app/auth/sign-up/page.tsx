"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "./actions";
import Link from "next/link";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Sign up failed.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <>
      <style>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          box-sizing: border-box;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          box-sizing: border-box;
        }
        .auth-title {
          margin-bottom: 1.5rem;
          font-size: clamp(1.5rem, 5vw, 2rem);
        }
        .auth-field {
          margin-bottom: 1rem;
        }
        .auth-label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }
        .auth-input {
          display: block;
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          /* Prevent iOS zoom on focus (must be >= 16px) */
          font-size: max(1rem, 16px);
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
        }
        .auth-input:focus {
          outline: 2px solid #2563eb;
          outline-offset: 1px;
          border-color: #2563eb;
        }
        .auth-error {
          color: #dc2626;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .auth-button {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          touch-action: manipulation;
          /* Minimum touch target height */
          min-height: 44px;
        }
        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-button:not(:disabled):active {
          background: #1d4ed8;
        }
        .auth-footer {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.95rem;
        }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="auth-title">Create an Account</h1>
        </div>
      </div>
    </>
  );
}