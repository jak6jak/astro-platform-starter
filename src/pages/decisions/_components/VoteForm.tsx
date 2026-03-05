import { useState, useEffect } from 'react';
import type { Decision } from '../../../types';

interface Props {
    decision: Decision;
}

export default function VoteForm({ decision }: Props) {
    const [selected, setSelected] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyVoted, setAlreadyVoted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (localStorage.getItem(`voted-${decision.id}`)) {
            setAlreadyVoted(true);
        }
    }, [decision.id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selected === null) return;
        setError(null);
        setSubmitting(true);

        let voterToken = localStorage.getItem(`token-${decision.id}`);
        if (!voterToken) {
            voterToken = crypto.randomUUID();
            localStorage.setItem(`token-${decision.id}`, voterToken);
        }

        try {
            const res = await fetch(`/api/decisions/${decision.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voterToken, optionIndex: selected })
            });

            if (res.status === 409) {
                localStorage.setItem(`voted-${decision.id}`, 'true');
                setAlreadyVoted(true);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'Something went wrong.');
                return;
            }

            localStorage.setItem(`voted-${decision.id}`, 'true');
            window.location.href = `/decisions/${decision.id}/results`;
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (alreadyVoted) {
        return (
            <div className="text-center">
                <p className="mb-2 text-lg font-semibold text-gray-700">You've already voted.</p>
                <p className="mb-6 text-gray-500">Each device can only vote once per decision.</p>
                <a href={`/decisions/${decision.id}/results`} className="btn">
                    View results
                </a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <fieldset>
                <legend className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Choose one option</legend>
                <div className="flex flex-col gap-3">
                    {decision.options.map((option, i) => (
                        <label
                            key={i}
                            className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-5 py-4 transition-colors ${
                                selected === i
                                    ? 'border-[--color-primary] bg-[--color-primary]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="option"
                                value={i}
                                checked={selected === i}
                                onChange={() => setSelected(i)}
                                className="accent-[--color-primary]"
                            />
                            <span className="text-base font-medium">{option}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting || selected === null} className="btn w-full justify-center disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit vote'}
            </button>
        </form>
    );
}
