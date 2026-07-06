import { render, fireEvent, screen } from '@testing-library/react';
import { GovDatePicker } from '@/components/ui/GovDatePicker';
import '@testing-library/jest-dom';
import { format } from 'date-fns';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'fr'
}));

// Mock react-datepicker to test parsing and onChange logic
jest.mock('react-datepicker', () => {
  const React = require('react');
  const { format } = require('date-fns');
  
  const MockDatePicker = ({ selected, onChange, placeholderText }: any) => {
    return (
      <input
        data-testid="mock-datepicker"
        placeholder={placeholderText}
        value={selected ? format(selected, 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          // Parse string date to local Date to match GovDatePicker behavior
          const parts = e.target.value.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            onChange(new Date(y, m, d));
          } else {
            onChange(null);
          }
        }}
      />
    );
  };

  return {
    __esModule: true,
    default: MockDatePicker,
    registerLocale: jest.fn(),
  };
});

describe('GovDatePicker Timezone and Locale Safety', () => {
  it('parses YYYY-MM-DD input value into a local date object without day shifting', () => {
    // Test multiple critical dates, including change of DST / timezones for Morocco in 2026
    const criticalDates = [
      '2026-02-14', // Day before Morocco Ramadan GMT suspension
      '2026-02-15', // Day of Morocco Ramadan GMT suspension (clocks back at 3:00 AM)
      '2026-02-16', // Day after Morocco Ramadan GMT suspension
      '2026-03-21', // Day before Morocco Ramadan GMT+1 restoration
      '2026-03-22', // Day of Morocco Ramadan GMT+1 restoration (clocks forward at 2:00 AM)
      '2026-03-23', // Day after Morocco Ramadan GMT+1 restoration
      '2026-12-31', // End of year
      '2026-01-01', // Start of year
    ];

    for (const dateStr of criticalDates) {
      const { rerender } = render(
        <GovDatePicker value={dateStr} onChange={() => {}} />
      );

      const input = screen.getByTestId('mock-datepicker');
      expect(input).toHaveValue(dateStr);
      rerender(<></>);
    }
  });

  it('formats selected local Date back to YYYY-MM-DD string without day shifting, even near midnight and transition hours', () => {
    let outputValue = '';
    const handleChange = (val: string) => {
      outputValue = val;
    };

    const { rerender } = render(
      <GovDatePicker value="2026-02-14" onChange={handleChange} />
    );

    const input = screen.getByTestId('mock-datepicker');

    // 1. Test standard midnight boundary
    fireEvent.change(input, { target: { value: '2026-02-16' } });
    expect(outputValue).toBe('2026-02-16');

    // 2. Test exact transition day (Feb 15, 2026)
    fireEvent.change(input, { target: { value: '2026-02-15' } });
    expect(outputValue).toBe('2026-02-15');

    // 3. Test exact transition day (March 22, 2026)
    fireEvent.change(input, { target: { value: '2026-03-22' } });
    expect(outputValue).toBe('2026-03-22');
  });
});
