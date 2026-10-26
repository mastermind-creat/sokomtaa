/**
 * Tests for TopTradersPreview — rank badge rendering
 * Requirements: 12.1, 12.2, 12.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

jest.mock('@/store/authStore', () => ({
    useAuthStore: (selector: (s: { isAuthenticated: () => boolean }) => unknown) =>
        selector({ isAuthenticated: () => true }),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>{children}</a>
    ),
}));

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
    },
    Variants: {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { TopTradersPreview } from '@/components/landing/TopTradersPreview';

const mockTrader = (id: number, overrides = {}) => ({
    id,
    business_name: `Trader ${id}`,
    average_rating: (5 - id * 0.1).toFixed(1),
    total_reviews: 100 - id * 10,
    is_open: true,
    avatar_url: null,
    market: { name: 'Test Market' },
    ...overrides,
});

function setupQuery(traders: ReturnType<typeof mockTrader>[]) {
    (useQuery as jest.Mock).mockReturnValue({
        data: { data: { top_traders: traders } },
        isLoading: false,
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TopTradersPreview — rank badge rendering', () => {
    it('renders rank badge 1 on first trader card', () => {
        setupQuery([mockTrader(1), mockTrader(2), mockTrader(3)]);
        render(<TopTradersPreview />);
        expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
    });

    it('rank 1 badge has gold styling (bg-amber-400 text-white)', () => {
        setupQuery([mockTrader(1), mockTrader(2), mockTrader(3)]);
        render(<TopTradersPreview />);
        const badge = screen.getByLabelText('Rank 1');
        expect(badge.className).toContain('bg-amber-400');
        expect(badge.className).toContain('text-white');
    });

    it('rank 2 badge has silver styling, rank 3 bronze', () => {
        setupQuery([mockTrader(1), mockTrader(2), mockTrader(3)]);
        render(<TopTradersPreview />);

        const badge2 = screen.getByLabelText('Rank 2');
        expect(badge2.className).toContain('bg-gray-300');
        expect(badge2.className).toContain('text-gray-800');

        const badge3 = screen.getByLabelText('Rank 3');
        expect(badge3.className).toContain('bg-amber-700');
        expect(badge3.className).toContain('text-white');
    });

    it('rank 4+ badge has neutral styling', () => {
        setupQuery([mockTrader(1), mockTrader(2), mockTrader(3), mockTrader(4)]);
        render(<TopTradersPreview />);
        const badge4 = screen.getByLabelText('Rank 4');
        expect(badge4.className).toContain('bg-gray-100');
        expect(badge4.className).toContain('text-gray-500');
    });

    it('shows sequential ranks when fewer than 3 traders returned', () => {
        setupQuery([mockTrader(1), mockTrader(2)]);
        render(<TopTradersPreview />);
        expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Rank 2')).toBeInTheDocument();
        expect(screen.queryByLabelText('Rank 3')).not.toBeInTheDocument();
    });

    it('badge text shows the rank number', () => {
        setupQuery([mockTrader(1), mockTrader(2), mockTrader(3)]);
        render(<TopTradersPreview />);
        expect(screen.getByLabelText('Rank 1')).toHaveTextContent('#1');
        expect(screen.getByLabelText('Rank 2')).toHaveTextContent('#2');
        expect(screen.getByLabelText('Rank 3')).toHaveTextContent('#3');
    });
});
