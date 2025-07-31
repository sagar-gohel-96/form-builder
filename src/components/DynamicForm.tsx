import React from 'react';
import {
  useForm,
  useFieldArray,
  Controller,
  type FieldValues,
} from 'react-hook-form';
import {
  Box,
  Button,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  Stack,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FieldWrapper } from './FieldWrapper';
import { PiMinusCircleDuotone, PiPlusCircleDuotone } from 'react-icons/pi';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectFieldWrapper } from './SelectWrapper';
import generateZodSchema from '../utils/generateZodSchema';

export interface FieldConfig {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: string[];
  itemType?: string;
  fields?: FieldConfig[];
  placeholder?: string;
  helperText?: string;
}

interface FormConfig {
  title: string;
  fields: FieldConfig[];
}

interface DynamicFormProps {
  config: FormConfig;
  onSubmit?: (data: any) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit: onSubmitProp,
}) => {
  const schema = generateZodSchema(config.fields);

  const generateDefaultValues = (fields: FieldConfig[]): any => {
    const defaults: any = {};
    fields.forEach((field) => {
      switch (field.type) {
        case 'boolean':
          defaults[field.name] = false;
          break;
        case 'array':
          defaults[field.name] = [];
          break;
        case 'number':
          defaults[field.name] = '';
          break;
        default:
          defaults[field.name] = '';
      }
    });
    return defaults;
  };

  const { control, handleSubmit, register, formState } = useForm<FieldValues>({
    resolver: zodResolver(schema as any),
    defaultValues: generateDefaultValues(config.fields),
    mode: 'onChange',
  });

  const onSubmit = async (data: any) => {
    try {
      console.log('Form submitted:', data);
      if (onSubmitProp) {
        onSubmitProp(data);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const renderField = (
    field: FieldConfig,
    path: string = ''
  ): React.ReactNode => {
    const fieldName = path ? `${path}.${field.name}` : field.name;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <FieldWrapper
            key={fieldName}
            label={field.label}
            name={fieldName}
            formState={formState}
            isRequired={field.required}
            helperText={field.helperText}
            field={
              <Input
                type={field.type}
                {...register(fieldName)}
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}`
                }
              />
            }
          />
        );

      case 'number':
        return (
          <FieldWrapper
            key={fieldName}
            label={field.label}
            name={fieldName}
            formState={formState}
            isRequired={field.required}
            helperText={field.helperText}
            field={
              <Input
                type="number"
                {...register(fieldName)}
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}`
                }
              />
            }
          />
        );

      case 'textarea':
        return (
          <FieldWrapper
            key={fieldName}
            label={field.label}
            name={fieldName}
            formState={formState}
            isRequired={field.required}
            helperText={field.helperText}
            field={
              <Textarea
                {...register(fieldName)}
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}`
                }
                resize="vertical"
              />
            }
          />
        );

      case 'select':
        return (
          <SelectFieldWrapper
            name={field.name}
            label={field.label}
            control={control}
            formState={formState}
            options={[]}
            isRequired
            placeholder={field.placeholder}
            helperText={field.helperText}
          />
        );

      case 'boolean':
        return (
          <FieldWrapper
            key={fieldName}
            label={field.label}
            name={fieldName}
            formState={formState}
            isRequired={field.required}
            helperText={field.helperText}
            field={
              <Controller
                name={fieldName}
                control={control}
                render={({ field: controllerField }) => (
                  <Checkbox.Root
                    checked={controllerField.value}
                    onCheckedChange={(e) => controllerField.onChange(e.checked)}
                  >
                    {field.label}
                  </Checkbox.Root>
                )}
              />
            }
          />
        );

      case 'radio':
        return (
          <FieldWrapper
            key={fieldName}
            label={field.label}
            name={fieldName}
            formState={formState}
            isRequired={field.required}
            helperText={field.helperText}
            field={
              <Controller
                name={fieldName}
                control={control}
                render={({ field: controllerField }) => (
                  <RadioGroup.Root
                    value={controllerField.value}
                    onValueChange={controllerField.onChange}
                  >
                    <Stack direction="column">
                      {field.options?.map((option) => (
                        <RadioGroup.Item key={option} value={option}>
                          <RadioGroup.ItemControl />
                          <RadioGroup.ItemText>{option}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </Stack>
                  </RadioGroup.Root>
                )}
              />
            }
          />
        );

      case 'array':
        return (
          <ArrayField
            key={fieldName}
            field={field}
            control={control}
            formState={formState}
            fieldName={fieldName}
            register={register}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack align="stretch">
          <Heading size="lg" color="gray.700" textAlign="center">
            {config.title}
          </Heading>

          {config.fields.map((field) => (
            <Box key={field.name}>{renderField(field)}</Box>
          ))}

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            loading={formState.isSubmitting}
            loadingText="Submitting..."
            mt={6}
          >
            Submit Form
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

// Array Field Component
interface ArrayFieldProps {
  field: FieldConfig;
  control: any;
  formState: any;
  fieldName: string;
  register: any;
}

const ArrayField: React.FC<ArrayFieldProps> = ({
  field,
  control,
  formState,
  fieldName,
  register,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const addItem = () => {
    if (field.fields) {
      // Array of objects
      const newItem: any = {};
      field.fields.forEach((subField) => {
        switch (subField.type) {
          case 'boolean':
            newItem[subField.name] = false;
            break;
          case 'number':
            newItem[subField.name] = '';
            break;
          default:
            newItem[subField.name] = '';
        }
      });
      append(newItem);
    } else {
      // Array of primitives
      append('');
    }
  };

  return (
    <FieldWrapper
      label={field.label}
      name={fieldName}
      formState={formState}
      isRequired={field.required}
      helperText={field.helperText}
      field={
        <VStack align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600">
              {fields.length} item{fields.length !== 1 ? 's' : ''}
            </Text>
            <Button
              onClick={addItem}
              size="sm"
              colorScheme="green"
              variant="outline"
            >
              <PiPlusCircleDuotone />
              Add Item
            </Button>
          </HStack>

          {fields.map((item, index) => (
            <Box
              key={item.id}
              p={4}
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="gray.50"
            >
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontWeight="medium" color="gray.700">
                  {field.label} #{index + 1}
                </Text>
                <IconButton
                  aria-label="Remove item"
                  onClick={() => remove(index)}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                >
                  <PiMinusCircleDuotone />
                </IconButton>
              </HStack>

              {field.fields ? (
                <VStack align="stretch">
                  {field.fields.map((subField) => {
                    const subFieldName = `${fieldName}.${index}.${subField.name}`;

                    switch (subField.type) {
                      case 'text':
                      case 'email':
                      case 'password':
                      case 'number':
                        return (
                          <FieldWrapper
                            key={subFieldName}
                            label={subField.label}
                            name={subFieldName}
                            formState={formState}
                            isRequired={subField.required}
                            field={
                              <Input
                                type={subField.type}
                                {...register(subFieldName)}
                                placeholder={
                                  subField.placeholder ||
                                  `Enter ${subField.label.toLowerCase()}`
                                }
                                size="sm"
                              />
                            }
                          />
                        );

                      case 'textarea':
                        return (
                          <FieldWrapper
                            key={subFieldName}
                            label={subField.label}
                            name={subFieldName}
                            formState={formState}
                            isRequired={subField.required}
                            field={
                              <Textarea
                                {...register(subFieldName)}
                                placeholder={
                                  subField.placeholder ||
                                  `Enter ${subField.label.toLowerCase()}`
                                }
                                size="sm"
                                resize="vertical"
                              />
                            }
                          />
                        );

                      case 'boolean':
                        return (
                          <FieldWrapper
                            key={subFieldName}
                            label={subField.label}
                            name={subFieldName}
                            formState={formState}
                            isRequired={subField.required}
                            field={
                              <Controller
                                name={subFieldName}
                                control={control}
                                render={({ field: controllerField }) => (
                                  <Checkbox.Root
                                    checked={controllerField.value}
                                    onCheckedChange={(e) =>
                                      controllerField.onChange(e.checked)
                                    }
                                    size="sm"
                                  >
                                    {subField.label}
                                  </Checkbox.Root>
                                )}
                              />
                            }
                          />
                        );

                      case 'select':
                        return (
                          <SelectFieldWrapper
                            name={field.name}
                            label={field.label}
                            control={control}
                            formState={formState}
                            options={[]}
                            isRequired
                            placeholder={field.placeholder}
                            helperText={field.helperText}
                          />
                        );

                      default:
                        return null;
                    }
                  })}
                </VStack>
              ) : (
                <FieldWrapper
                  label={`${field.label} Item`}
                  name={`${fieldName}.${index}`}
                  formState={formState}
                  field={
                    <Input
                      {...register(`${fieldName}.${index}`)}
                      placeholder={
                        field.placeholder ||
                        `Enter ${field.label.toLowerCase()}`
                      }
                      size="sm"
                    />
                  }
                />
              )}
            </Box>
          ))}

          {fields.length === 0 && (
            <Box p={6} bg="gray.100" borderRadius="md" textAlign="center">
              <Text color="gray.500" fontSize="sm" fontStyle="italic">
                No items added yet. Click "Add Item" to create the first item.
              </Text>
            </Box>
          )}
        </VStack>
      }
    />
  );
};

export default DynamicForm;
