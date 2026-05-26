import { vi } from 'vitest'

// Next.js server-only guard — not needed in unit tests
vi.mock('server-only', () => ({}))

// next/cache stubs
vi.mock('next/cache', () => ({
  revalidatePath:   vi.fn(),
  unstable_cache:   vi.fn((fn: () => unknown) => fn),
}))

// next/navigation stubs
vi.mock('next/navigation', () => ({
  redirect:   vi.fn(),
  notFound:   vi.fn(),
  useRouter:  vi.fn(),
  usePathname: vi.fn(),
}))
