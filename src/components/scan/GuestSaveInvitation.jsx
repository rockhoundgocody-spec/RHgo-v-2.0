import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookmarkCheck } from 'lucide-react';

export default function GuestSaveInvitation({ mineralName, imageUrl, onContinue }) {
  return <section className="absolute inset-0 z-40 overflow-y-auto bg-discovery-bg text-discovery-ink flex flex-col justify-center p-6" aria-labelledby="guest-save-title">
    <div className="mx-auto w-full max-w-sm text-center">
      {imageUrl && <img src={imageUrl} alt={mineralName || 'Your specimen'} className="mx-auto mb-5 h-28 w-28 rounded-2xl object-cover border border-discovery-line" />}
      <BookmarkCheck className="mx-auto mb-3 text-discovery-amber" size={26} aria-hidden="true" />
      <p className="text-sm text-discovery-muted mb-2">Your latest report is held on this device</p>
      <h2 id="guest-save-title" className="text-3xl font-bold tracking-tight mb-3">Make this find the first of many.</h2>
      <p className="text-discovery-muted leading-relaxed mb-6">Create an account to bring this report into your collection. Another guest scan replaces this device’s latest report.</p>
      <Link to="/register?next=%2F" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-discovery-amber text-discovery-bg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Create account & keep my find <ArrowRight size={18} aria-hidden="true" /></Link>
      <Link to="/signin?next=%2F" className="flex min-h-12 items-center justify-center text-discovery-ink underline underline-offset-4 mt-2">Already have an account? Sign in</Link>
      <button type="button" onClick={onContinue} className="min-h-12 w-full text-discovery-muted rounded-xl border border-discovery-line mt-4 focus-visible:outline focus-visible:outline-2">Continue without an account</button>
    </div>
  </section>;
}