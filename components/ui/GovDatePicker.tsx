'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useLocale } from 'next-intl';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { arMA } from 'date-fns/locale/ar-MA';
import 'react-datepicker/dist/react-datepicker.css';
import { GovInput } from './GovInput';
import { Calendar } from 'lucide-react';

registerLocale('fr', fr);
registerLocale('ar', arMA);

export interface GovDatePickerProps {
  label?: string;
  error?: string;
  value?: string; // Format attendu: 'YYYY-MM-DD'
  onChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  name?: string;
}

const GovDatePicker = forwardRef<any, GovDatePickerProps>(
  ({ label, error, value, onChange, className, containerClassName, disabled, minDate, maxDate, placeholder, name }, ref) => {
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
      if (value) {
        // Parse 'YYYY-MM-DD' to local Date object to avoid UTC shift
        const parts = value.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const dateObj = new Date(year, month, day);
          setSelectedDate(dateObj);
        } else {
          setSelectedDate(null);
        }
      } else {
        setSelectedDate(null);
      }
    }, [value]);

    const handleDateChange = (date: Date | null) => {
      setSelectedDate(date);
      if (onChange) {
        if (date) {
          // Format Date back to 'YYYY-MM-DD' safely in local timezone
          onChange(format(date, 'yyyy-MM-dd'));
        } else {
          onChange('');
        }
      }
    };

    return (
      <div className={`gov-datepicker-wrapper ${isAr ? 'gov-datepicker-rtl' : ''} ${containerClassName || ''}`}>
        <DatePicker
          locale={isAr ? 'ar' : 'fr'}
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          name={name}
          placeholderText={placeholder || (isAr ? 'يوم/شهر/سنة' : 'JJ/MM/AAAA')}
          customInput={
            <GovInput
              label={label}
              error={error}
              leftIcon={!isAr ? <Calendar size={16} /> : undefined}
              rightIcon={isAr ? <Calendar size={16} /> : undefined}
              className={className}
              ref={ref as any}
            />
          }
          calendarClassName={isAr ? 'react-datepicker-rtl' : ''}
        />
      </div>
    );
  }
);

GovDatePicker.displayName = 'GovDatePicker';

export { GovDatePicker };
