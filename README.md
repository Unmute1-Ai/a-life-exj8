# U1 Organism v0.1.0

Unmute1AI's adaptive intelligence organism. The architecture coordinates perception, application-level Mixture of Experts (MoE), Mixture of Agents (MoA) synthesis, falsification, experience, and U1Si-Q authority. U1Si-Q is an organism subsystem, not a firewall metaphor.

## Implemented
- Responsive organism operator UI.
- Server-side specialist routing across Context, Pattern, Prediction, Critic, Safety, and Accessibility.
- Specialist assessments synthesized through a separate MoA pass.
- OpenAI-compatible chat-completions provider adapter.
- Explicit missing-provider/error states; no fabricated model outputs.
- Advisory-only execution posture: model responses cannot execute actions or grant permissions.
- SHA-256 digest receipt with explicit limitations.

## Run locally
Requires Node.js 20.9+ (Node 24 recommended) and npm.

```bash
npm install
cp .env.example .env.local
# Set MODEL_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000. Optional environment values: `MODEL_BASE_URL` (defaults to https://api.openai.com/v1) and `MODEL_NAME` (defaults to gpt-4o-mini). Keep credentials server-side and never use NEXT_PUBLIC_ for secrets.

## API
- `GET /api/organism/turn`: provider readiness and specialist list.
- `POST /api/organism/turn`: accepts `{ "input": "..." }`, returns routed specialists, synthesis, advisory authority state, and a SHA-256 digest.

## Invariants and limitations
**Intelligence recommends. Authority decides.** Confidence and specialist consensus never grant permissions. Real execution requires a separately implemented server-enforced U1Si-Q service with identity, scoped capabilities, approval policy, replay protection, and audit verification.

This is an application scaffold, not a trained neural MoE model, sentient system, clinical inference product, or autonomous agent. Durable learning, outcome capture, calibration metrics, microphone capture, and real action execution are not yet implemented. A digest is integrity metadata, not proof of truth, provenance, authorization, or execution.

Run `npm run build` to verify the production build.
