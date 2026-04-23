import { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/ui/input';
import { sanitizeDecimalInput, decimalInputToNumber } from '@/shared/lib/decimalInput';

type NativeInputProps = Omit<
    React.ComponentProps<'input'>,
    'value' | 'onChange' | 'type' | 'defaultValue'
>;

export interface DecimalTextFieldProps extends NativeInputProps {
    value: number;
    onValueChange: (n: number) => void;
    /** Si es true y value es 0, muestra vacío cuando no hay borrador de teclado */
    emptyWhenZero?: boolean;
}

/**
 * Monto decimal editable: permite escribir "12.23" sin perder el "." al usar solo números en estado.
 */
export const DecimalTextField = ({
    value,
    onValueChange,
    className,
    disabled,
    placeholder = '0',
    emptyWhenZero = true,
    onFocus,
    onBlur,
    ...rest
}: DecimalTextFieldProps) => {
    const [draft, setDraft] = useState<string | null>(null);
    const focusedRef = useRef(false);

    const display =
        draft !== null
            ? draft
            : emptyWhenZero && value === 0
              ? ''
              : value % 1 === 0 ? String(value) : value.toFixed(2);

    useEffect(() => {
        if (!focusedRef.current) {
            setDraft(null);
        }
    }, [value]);

    return (
        <Input
            type="text"
            inputMode="decimal"
            disabled={disabled}
            className={className}
            placeholder={placeholder}
            value={display}
            onFocus={(e) => {
                focusedRef.current = true;
                onFocus?.(e);
            }}
            onBlur={(e) => {
                focusedRef.current = false;
                setDraft(null);
                onBlur?.(e);
            }}
            onChange={(e) => {
                const raw = sanitizeDecimalInput(e.target.value);
                setDraft(raw);
                onValueChange(decimalInputToNumber(raw));
            }}
            {...rest}
        />
    );
};
