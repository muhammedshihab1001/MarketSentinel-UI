import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './Dashboard';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the Recharts ResponsiveContainer to avoid size rendering issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const OriginalRecharts = await importOriginal<typeof import('recharts')>();
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => (
      <OriginalRecharts.ResponsiveContainer width={800} height={800}>
        {children}
      </OriginalRecharts.ResponsiveContainer>
    ),
  };
});

describe('Dashboard Component', () => {
  it('renders the Dashboard header and initial stats', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Assert the main header is visible
    expect(screen.getByText('System Status')).toBeInTheDocument();
    
    // Assert that metric cards have loaded with mock initial data
    expect(screen.getByText('Gross Exposure')).toBeInTheDocument();
    expect(screen.getByText('Net Exposure')).toBeInTheDocument();
    
    // Validate top 5 opportunities table is rendered
    expect(screen.getByText('Top Model Opportunities')).toBeInTheDocument();
  });
});
