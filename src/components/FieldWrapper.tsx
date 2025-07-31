import { Field } from "@chakra-ui/react";
import React from "react";
import { get, type FormState } from "react-hook-form";

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
