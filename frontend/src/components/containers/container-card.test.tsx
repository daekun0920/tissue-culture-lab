import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContainerCard } from './container-card';
import type { Container } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────

const makeContainer = (overrides: Partial<Container> = {}): Container => ({
  qrCode: '1001',
  status: 'EMPTY',
  containerTypeId: null,
  mediaId: null,
  cultureId: null,
  parentId: null,
  notes: null,
  cultureDate: null,
  subcultureInterval: null,
  dueSubcultureDate: null,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

function renderCard(
  props: {
    container?: Container;
    selectable?: boolean;
    selected?: boolean;
    onToggle?: () => void;
  } = {},
) {
  const {
    container = makeContainer(),
    selectable,
    selected,
    onToggle,
  } = props;

  return render(
    <MemoryRouter>
      <ContainerCard
        container={container}
        selectable={selectable}
        selected={selected}
        onToggle={onToggle}
      />
    </MemoryRouter>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────

describe('ContainerCard', () => {
  it('renders QR code text', () => {
    renderCard({ container: makeContainer({ qrCode: 'TC-42' }) });

    expect(screen.getByText('TC-42')).toBeInTheDocument();
  });

  it('shows culture name when culture exists', () => {
    renderCard({
      container: makeContainer({
        status: 'HAS_CULTURE',
        culture: {
          id: 'c1',
          name: 'Phalaenopsis',
          defaultSubcultureInterval: 14,
        },
      }),
    });

    expect(screen.getByText('Phalaenopsis')).toBeInTheDocument();
  });

  it('shows recipe name when media exists (no culture)', () => {
    renderCard({
      container: makeContainer({
        status: 'HAS_MEDIA',
        media: {
          id: 'mb1',
          recipeId: 'r1',
          batchNumber: 'B-001',
          datePrep: '2025-01-01',
          notes: null,
          recipe: {
            id: 'r1',
            name: 'MS Medium',
            baseType: 'MS',
            phLevel: 5.8,
            agar: 8,
            hormones: 'BAP 1mg/L',
          },
        },
      }),
    });

    expect(screen.getByText('MS Medium')).toBeInTheDocument();
  });

  it('shows "Overdue" for overdue HAS_CULTURE containers', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    renderCard({
      container: makeContainer({
        status: 'HAS_CULTURE',
        dueSubcultureDate: yesterday.toISOString(),
      }),
    });

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not show "Overdue" when not overdue', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    renderCard({
      container: makeContainer({
        status: 'HAS_CULTURE',
        dueSubcultureDate: tomorrow.toISOString(),
      }),
    });

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('renders as Link when not selectable', () => {
    renderCard({ container: makeContainer({ qrCode: 'TC-42' }) });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/containers/TC-42');
  });

  it('shows checkbox when selectable=true', () => {
    renderCard({
      selectable: true,
      selected: false,
      onToggle: vi.fn(),
    });

    expect(
      screen.getByRole('checkbox', { name: /select container/i }),
    ).toBeInTheDocument();
  });

  it('applies blue ring when selected=true', () => {
    const { container } = renderCard({
      selectable: true,
      selected: true,
      onToggle: vi.fn(),
    });

    // The Card element should have the ring-blue-400 class
    const card = container.querySelector('.ring-blue-400');
    expect(card).not.toBeNull();
  });

  it('calls onToggle when card clicked in selectable mode', () => {
    const onToggle = vi.fn();
    renderCard({
      selectable: true,
      selected: false,
      onToggle,
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not show checkbox when selectable=false (default)', () => {
    renderCard();

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
