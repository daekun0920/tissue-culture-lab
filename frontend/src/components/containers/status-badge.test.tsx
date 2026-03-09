import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';
import type { ContainerStatus } from '@/types';

describe('StatusBadge', () => {
  const cases: [ContainerStatus, string][] = [
    ['EMPTY', 'Empty'],
    ['HAS_MEDIA', 'Has Media'],
    ['HAS_CULTURE', 'Culture'],
    ['DISCARDED', 'Discarded'],
  ];

  it.each(cases)('renders "%s" as "%s"', (status, expectedLabel) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});
