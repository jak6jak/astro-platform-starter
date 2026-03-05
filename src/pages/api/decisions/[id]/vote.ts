import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import type { Decision, Vote } from '../../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
    const { id } = params;

    let body: { voterToken?: unknown; optionIndex?: unknown };
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { voterToken, optionIndex } = body;

    if (typeof voterToken !== 'string' || voterToken.trim() === '') {
        return new Response(JSON.stringify({ error: 'voterToken is required' }), { status: 400 });
    }

    if (typeof optionIndex !== 'number' || !Number.isInteger(optionIndex) || optionIndex < 0) {
        return new Response(JSON.stringify({ error: 'optionIndex must be a non-negative integer' }), { status: 400 });
    }

    const decisionStore = getStore({ name: 'decisions', consistency: 'strong' });
    const decision: Decision | null = await decisionStore.get(id!, { type: 'json' });

    if (!decision) {
        return new Response(JSON.stringify({ error: 'Decision not found' }), { status: 404 });
    }

    if (optionIndex >= decision.options.length) {
        return new Response(JSON.stringify({ error: 'optionIndex out of range' }), { status: 400 });
    }

    const voteStore = getStore({ name: `votes-${id}`, consistency: 'strong' });
    const existing = await voteStore.get(voterToken);

    if (existing !== null) {
        return new Response(JSON.stringify({ error: 'already_voted' }), { status: 409 });
    }

    const vote: Vote = { optionIndex, votedAt: new Date().toISOString() };
    await voteStore.setJSON(voterToken, vote);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
