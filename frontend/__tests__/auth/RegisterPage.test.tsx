/**
 * Tests for RegisterPage — phone/email toggle behaviour
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/api', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

jest.mock('@/store/authStore', () => ({
    useAuthStore: (selector: (s: { setAuth: jest.Mock }) => unknown) =>
        selector({ setAuth: jest.fn() }),
}));

// Stub out layout-only components so the form renders in isolation
jest.mock('@/components/shared/Logo', () => ({
    Logo: () => <div data-testid="logo" />,
}));
jest.mock('@/components/auth/AuthCinematicSide', () => ({
    AuthCinematicSide: () => <div data-testid="cinematic-side" />,
}));
jest.mock('@/components/shared/TurnstileWidget', () => ({
    __esModule: true,
    default: ({ onVerify }: { onVerify: (t: string) => void }) => (
        <button data-testid="turnstile" onClick={() => onVerify('mock-token')}>
            Complete Check
        </button>
    ),
}));
jest.mock('@/components/auth/SocialAuthButtons', () => ({
    SocialAuthButtons: () => <div data-testid="social-auth" />,
}));

jest.mock('@/lib/utils', () => ({
    normalizePhoneNumber: (p: string) => p,
    handleApiError: (e: unknown) => (e as { message?: string })?.message ?? 'Error',
}));

// Framer-motion no-op so animations don't interfere
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    },
}));

// ── Subject under test ───────────────────────────────────────────────────────

import RegisterPage from '@/app/(auth)/register/page';
import api from '@/lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
    return render(<RegisterPage />);
}

function getPhoneToggle() {
    return screen.getByTestId('toggle-phone');
}

function getEmailToggle() {
    return screen.getByTestId('toggle-email');
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage — phone/email toggle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Requirement 3.1: default is Phone Number
    it('shows phone field by default', () => {
        renderPage();
        expect(screen.getByTestId('input-phone')).toBeInTheDocument();
        expect(screen.queryByTestId('input-email')).not.toBeInTheDocument();
    });

    // Requirement 3.2: selecting Email Address shows email field
    it('switches to email field when Email Address toggle selected', async () => {
        renderPage();
        await userEvent.click(getEmailToggle());
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
    });

    // Requirement 3.3: selecting Email Address hides phone field
    it('hides phone field when Email Address is selected', async () => {
        renderPage();
        await userEvent.click(getEmailToggle());
        expect(screen.queryByTestId('input-phone')).not.toBeInTheDocument();
    });

    // Requirement 3.4: email field validates RFC 5322 pattern before submission
    it('email field shows validation error for invalid email before submission', async () => {
        renderPage();
        await userEvent.click(getEmailToggle());

        // Type an invalid email
        await userEvent.type(screen.getByTestId('input-email'), 'not-an-email');

        // Fill name, a strong password, confirm password, and turnstile so the
        // button is enabled — only then does RHF run field-level validation on submit
        await userEvent.type(screen.getByPlaceholderText(/john kamau/i), 'Jane Test');
        const [pwdInput, pwdConfirmInput] = screen.getAllByPlaceholderText(/••••••••/);
        await userEvent.type(pwdInput, 'Test@1234Abc');
        await userEvent.type(pwdConfirmInput, 'Test@1234Abc');
        await userEvent.click(screen.getByTestId('turnstile'));

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/valid email/i)).toBeInTheDocument();
        });
    });

    // Requirement 3.7: after successful email registration, navigate to /verify-email
    it('navigates to verify-email page after successful email registration', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({
            data: { user: { id: 1, name: 'Jane', email: 'jane@example.com', role: 'resident', phone_verified: false }, token: 'tok' },
            success: true,
        });

        renderPage();

        // Switch to email mode
        await userEvent.click(getEmailToggle());

        // Fill in name
        await userEvent.type(screen.getByPlaceholderText(/john kamau/i), 'Jane Wanjiku');

        // Fill in email
        await userEvent.type(screen.getByTestId('input-email'), 'jane@example.com');

        // Fill password and confirm password (both share the same placeholder ••••••••)
        const [pwdInput, pwdConfirmInput] = screen.getAllByPlaceholderText(/••••••••/);
        await userEvent.type(pwdInput, 'Test@1234Abc');
        await userEvent.type(pwdConfirmInput, 'Test@1234Abc');

        // Complete security check (mocked turnstile)
        await userEvent.click(screen.getByTestId('turnstile'));

        // Submit
        const submitBtn = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/verify-email');
        });
    });

    // Supplementary: switching back to phone restores phone field
    it('restores phone field when switching back to Phone Number', async () => {
        renderPage();
        await userEvent.click(getEmailToggle());
        expect(screen.getByTestId('input-email')).toBeInTheDocument();

        await userEvent.click(getPhoneToggle());
        expect(screen.getByTestId('input-phone')).toBeInTheDocument();
        expect(screen.queryByTestId('input-email')).not.toBeInTheDocument();
    });

    // Supplementary: phone path navigates to /verify (unchanged)
    it('navigates to /verify after successful phone registration', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({
            data: { user: { id: 2, name: 'John', phone: '0712345678', role: 'resident', phone_verified: false }, token: 'tok2' },
            success: true,
        });

        renderPage();
        // Phone mode is default — no toggle needed

        await userEvent.type(screen.getByPlaceholderText(/john kamau/i), 'John Kamau');
        await userEvent.type(screen.getByTestId('input-phone'), '0712345678');

        const [pwdInput, pwdConfirmInput] = screen.getAllByPlaceholderText(/••••••••/);
        await userEvent.type(pwdInput, 'Test@1234Abc');
        await userEvent.type(pwdConfirmInput, 'Test@1234Abc');

        await userEvent.click(screen.getByTestId('turnstile'));

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/verify');
        });
    });

    // Toggle buttons meet 48×48px tap target (AGENTS.md Section 2)
    it('toggle buttons have minimum 48px height via min-h-[48px] class', () => {
        renderPage();
        expect(getPhoneToggle()).toHaveClass('min-h-[48px]');
        expect(getEmailToggle()).toHaveClass('min-h-[48px]');
    });
});
