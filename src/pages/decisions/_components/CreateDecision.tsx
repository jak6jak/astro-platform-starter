import { useState } from 'react';

export default function CreateDecision() {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function updateOption(index: number, value: string) {
        setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
    }

    function addOption() {
        if (options.length < 10) setOptions((prev) => [...prev, '']);
    }

    function removeOption(index: number) {
        if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
        if (!question.trim()) {
            setError('Please enter a question.');
            return;
        }
        if (cleanOptions.length < 2) {
            setError('Please enter at least 2 options.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question.trim(), options: cleanOptions })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Something went wrong.');
                return;
            }
            window.location.href = `/decisions/${data.id}/results`;
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <label htmlFor="question" className="font-semibold text-gray-700">
                    Question
                </label>
                <input
                    id="question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Where should we hold the team retreat?"
                    className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30"
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700">Options</span>
                <div className="flex flex-col gap-3">
                    {options.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30"
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(i)}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-500"
                                    aria-label="Remove option"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {options.length < 10 && (
                    <button
                        type="button"
                        onClick={addOption}
                        className="mt-1 self-start text-sm font-medium text-[--color-primary] hover:underline"
                    >
                        + Add option
                    </button>
                )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn w-full justify-center">
                {submitting ? 'Creating…' : 'Create Decision'}
            </button>
        </form>
    );
}
