import { HttpResponse, http } from 'msw';

import type { User, UserInput } from '@/api/users';

// In-memory mock of the BFF, shared by `pnpm dev:mock` and the tests. It answers like a real
// BFF: problem+json errors, a correlation id, 409 on a stale version, 422 on a business rule.
const PAGE_SIZE = 5;

const seed = (): User[] =>
  [
    ['Ana Torres', 'ADMIN'],
    ['Bruno Díaz', 'AGENT'],
    ['Carla Méndez', 'VIEWER'],
    ['Diego Rojas', 'AGENT'],
    ['Elena Vargas', 'VIEWER'],
    ['Felipe Castro', 'ADMIN'],
    ['Gabriela Ruiz', 'AGENT'],
  ].map(([name = '', role], index) => ({
    email: `${name.split(' ')[0]?.toLowerCase()}@example.com`,
    id: `u-${index + 1}`,
    name,
    role: role as User['role'],
    team: role === 'AGENT' ? 'Soporte' : undefined,
    version: 1,
  }));

let users = seed();

export const resetMockDb = () => {
  users = seed();
};

const problem = (status: number, title: string, detail?: string) =>
  HttpResponse.json(
    { detail, status, title },
    {
      headers: {
        'Content-Type': 'application/problem+json',
        'X-Correlation-Id': 'mock-correlation-id',
      },
      status,
    },
  );

const emailTaken = (email: string, exceptId?: string) =>
  users.some((user) => user.email === email && user.id !== exceptId);

export const handlers = [
  http.get('*/api/users', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const search = (params.get('search') ?? '').toLowerCase();
    const page = Number(params.get('page')) || 1;
    const matches = users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(search),
    );
    return HttpResponse.json({
      items: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      page,
      totalPages: Math.max(1, Math.ceil(matches.length / PAGE_SIZE)),
    });
  }),

  http.get('*/api/users/:id', ({ params }) => {
    const user = users.find((candidate) => candidate.id === params.id);
    return user ? HttpResponse.json(user) : problem(404, 'Not found');
  }),

  http.post('*/api/users', async ({ request }) => {
    const input = (await request.json()) as UserInput;
    if (emailTaken(input.email)) {
      return problem(422, 'Business rule', 'Ya existe un usuario con ese correo.');
    }
    const user: User = { ...input, id: `u-${users.length + 1}`, version: 1 };
    users = [...users, user];
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put('*/api/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as UserInput & { version: number };
    const current = users.find((user) => user.id === params.id);
    if (!current) return problem(404, 'Not found');
    if (body.version !== current.version) return problem(409, 'Version conflict');
    if (emailTaken(body.email, current.id)) {
      return problem(422, 'Business rule', 'Ya existe un usuario con ese correo.');
    }
    // `team` is omitted from the JSON when the role has none, so clear it explicitly.
    const updated: User = { ...current, ...body, team: body.team, version: current.version + 1 };
    users = users.map((user) => (user.id === updated.id ? updated : user));
    return HttpResponse.json(updated);
  }),
];
