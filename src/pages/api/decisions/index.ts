import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import { uniqueName } from '../../../utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    let body: { question?: unknown; options?: unknown };
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { question, options } = body;

    if (typeof question !== 'string' || question.trim() === '') {
        return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
        return new Response(JSON.stringify({ error: 'At least 2 options are required' }), { status: 400 });
    }

    const cleanOptions = options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
    if (cleanOptions.length < 2) {
        return new Response(JSON.stringify({ error: 'At least 2 non-empty options are required' }), { status: 400 });
    }

    const id = uniqueName();
    const decision = {
        id,
        question: question.trim(),
        options: cleanOptions,
        createdAt: new Date().toISOString()
    };

    const store = getStore('decisions');
    await store.setJSON(id, decision);

    return new Response(JSON.stringify({ id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
