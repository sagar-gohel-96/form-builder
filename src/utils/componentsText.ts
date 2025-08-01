export const FIELD_WRAPPER = `import { Field } from '@chakra-ui/react';
import React from 'react';
import { get, type FormState } from 'react-hook-form';

interface FieldWrapperProps {
  label: string;
  field: React.ReactNode;
  helperText?: string;
  formState: FormState<any>;
  name: string;
  isRequired?: boolean;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  field,
  formState,
  helperText,
  label,
  name,
  isRequired = false,
}) => {
  // Get error for this specific field (supports nested paths like "users.0.email")
  const error = get(formState.errors, name);

  // Check if field has been touched (supports nested paths)
  const isTouched = get(formState.touchedFields, name);

  // Determine if we should show the error
  // Show error if field has been touched or if form has been submitted
  const shouldShowError = error && (isTouched || formState.isSubmitted);

  return (
    <Field.Root invalid={shouldShowError}>
      <Field.Label>
        {label}
        {isRequired && <Field.RequiredIndicator />}
      </Field.Label>
      {field}
      {helperText && !shouldShowError && (
        <Field.HelperText>{helperText}</Field.HelperText>
      )}
      {shouldShowError && <Field.ErrorText>{error.message}</Field.ErrorText>}
    </Field.Root>
  );
};
`;

export const SELECT_WRAPPER = `import React, { useMemo } from 'react';
import { Controller, type Control, type FormState, get } from 'react-hook-form';
import { Select, Portal, Field, createListCollection } from '@chakra-ui/react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectWrapperProps {
  name: string;
  label: string;
  control: Control<any>;
  formState: FormState<any>;
  options: SelectOption[];
  isRequired?: boolean;
  placeholder?: string;
  helperText?: string;
  width?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SelectFieldWrapper: React.FC<SelectWrapperProps> = ({
  name,
  label,
  control,
  formState,
  options,
  isRequired = false,
  placeholder,
  helperText,
  width = '100%',
  size = 'md',
}) => {
  const collection = useMemo(() => {
    return createListCollection({
      items: options ?? [],
      //   itemToString: (option) => option.label,
      //   itemToValue: (option) => option.value,
    });
  }, [options]);

  const error = get(formState.errors, name);
  const isTouched = get(formState.touchedFields, name);
  const shouldShowError = error && (isTouched || formState.isSubmitted);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select.Root
          collection={collection}
          value={field.value ? [field.value] : []}
          onValueChange={(details) => {
            field.onChange(details.value[0] || '');
          }}
          width={width}
          size={size}
          invalid={shouldShowError}
        >
          <Select.Label>
            {label}
            {isRequired && <Field.RequiredIndicator />}
          </Select.Label>

          <Select.HiddenSelect />

          <Select.Control>
            <Select.Trigger>
              <Select.ValueText
                placeholder={placeholder || \`Select \${label.toLowerCase()}\`}
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content>
                {options.map((option) => (
                  <Select.Item item={option} key={option.value}>
                    {option.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>

          {helperText && !shouldShowError && (
            <Field.HelperText>{helperText}</Field.HelperText>
          )}
          {shouldShowError && (
            <Field.ErrorText>{error?.message}</Field.ErrorText>
          )}
        </Select.Root>
      )}
    />
  );
};
`;
