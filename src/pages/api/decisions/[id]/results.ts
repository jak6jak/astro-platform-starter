import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import type { Decision, Vote, VoteTally, DecisionResults } from '../../../../types';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
    const { id } = params;

    const decisionStore = getStore({ name: 'decisions', consistency: 'strong' });
    const decision: Decision | null = await decisionStore.get(id!, { type: 'json' });

    if (!decision) {
        return new Response(JSON.stringify({ error: 'Decision not found' }), { status: 404 });
    }

    const counts = new Array<number>(decision.options.length).fill(0);
    const voteStore = getStore({ name: `votes-${id}`, consistency: 'strong' });
    const { blobs } = await voteStore.list();

    for (const blob of blobs) {
        const vote: Vote | null = await voteStore.get(blob.key, { type: 'json' });
        if (vote && vote.optionIndex >= 0 && vote.optionIndex < counts.length) {
            counts[vote.optionIndex]++;
        }
    }

    const totalVotes = counts.reduce((sum, c) => sum + c, 0);
    const tallies: VoteTally[] = decision.options.map((option, i) => ({ option, count: counts[i] }));

    let winner: VoteTally | null = null;
    if (totalVotes > 0) {
        winner = tallies.reduce((best, t) => (t.count > best.count ? t : best), tallies[0]);
    }

    const results: DecisionResults = { decision, tallies, totalVotes, winner };

    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
