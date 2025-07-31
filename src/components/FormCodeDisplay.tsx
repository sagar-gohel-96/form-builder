import React, { useState } from 'react';
import { Copy, Check, Code, Download, FileText } from 'lucide-react';

// Types for the form configuration
interface FieldConfig {
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

interface FormCodeGeneratorProps {
  config: FormConfig;
}

const FormCodeGenerator: React.FC<FormCodeGeneratorProps> = ({ config }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'component' | 'schema' | 'types'>(
    'component'
  );

  // Generate Zod Schema Code
  const generateZodSchemaCode = () => {
    const generateFieldValidation = (field: FieldConfig): string => {
      let validation = '';

      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'textarea':
          validation = 'z.string()';
          if (field.validation?.minLength) {
            validation += `.min(${field.validation.minLength}, "Minimum ${field.validation.minLength} characters required")`;
          }
          if (field.validation?.maxLength) {
            validation += `.max(${field.validation.maxLength}, "Maximum ${field.validation.maxLength} characters allowed")`;
          }
          if (field.type === 'email') {
            validation += '.email("Invalid email format")';
          }
          if (field.validation?.pattern) {
            validation += `.regex(/${field.validation.pattern}/, "Invalid format")`;
          }
          break;
        case 'number':
          validation = 'z.coerce.number()';
          if (field.validation?.min !== undefined) {
            validation += `.min(${field.validation.min}, "Minimum value is ${field.validation.min}")`;
          }
          if (field.validation?.max !== undefined) {
            validation += `.max(${field.validation.max}, "Maximum value is ${field.validation.max}")`;
          }
          break;
        case 'boolean':
          validation = 'z.boolean()';
          break;
        case 'select':
        case 'radio':
          if (field.options && field.options.length > 0) {
            validation = `z.enum([${field.options
              .map((opt) => `"${opt}"`)
              .join(', ')}])`;
          } else {
            validation = 'z.string()';
          }
          break;
        case 'array':
          if (field.fields) {
            const objectFields = field.fields
              .map(
                (subField) =>
                  `    ${subField.name}: ${generateFieldValidation(subField)}`
              )
              .join(',\n');
            validation = `z.array(z.object({\n${objectFields}\n  }))`;
          } else {
            validation = 'z.array(z.string())';
          }
          break;
        default:
          validation = 'z.string()';
      }

      if (!field.required) {
        validation += '.optional()';
      }

      return validation;
    };

    return `import { z } from 'zod';

export const ${config.title
      .replace(/\s+/g, '')
      .toLowerCase()}Schema = z.object({
${config.fields
  .map((field) => `  ${field.name}: ${generateFieldValidation(field)}`)
  .join(',\n')}
});

export type ${config.title.replace(
      /\s+/g,
      ''
    )}FormData = z.infer<typeof ${config.title
      .replace(/\s+/g, '')
      .toLowerCase()}Schema>;`;
  };

  // Generate Types Code
  const generateTypesCode = () => {
    return `export interface ${config.title.replace(/\s+/g, '')}FormData {
${config.fields
  .map((field) => {
    let type = 'string';
    switch (field.type) {
      case 'number':
        type = 'number';
        break;
      case 'boolean':
        type = 'boolean';
        break;
      case 'select':
      case 'radio':
        if (field.options && field.options.length > 0) {
          type = field.options.map((opt) => `"${opt}"`).join(' | ');
        }
        break;
      case 'array':
        if (field.fields) {
          const subTypes = field.fields
            .map((subField) => {
              let subType = 'string';
              if (subField.type === 'number') subType = 'number';
              if (subField.type === 'boolean') subType = 'boolean';
              return `${subField.name}: ${subType}`;
            })
            .join('; ');
          type = `Array<{ ${subTypes} }>`;
        } else {
          type = 'string[]';
        }
        break;
    }
    return `  ${field.name}${field.required ? '' : '?'}: ${type};`;
  })
  .join('\n')}
}`;
  };

  // Generate Main Component Code
  const generateComponentCode = () => {
    const componentName = config.title.replace(/\s+/g, '');
    const formName = config.title.replace(/\s+/g, '').toLowerCase();

    const generateDefaultValues = () => {
      const defaults = config.fields
        .map((field) => {
          let defaultValue = "''";
          switch (field.type) {
            case 'boolean':
              defaultValue = 'false';
              break;
            case 'array':
              defaultValue = '[]';
              break;
            case 'number':
              defaultValue = 'undefined';
              break;
          }
          return `    ${field.name}: ${defaultValue}`;
        })
        .join(',\n');
      return defaults;
    };

    const generateFieldComponents = () => {
      return config.fields
        .map((field) => {
          const fieldName = field.name;

          switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <Input
              type="${field.type}"
              {...register('${fieldName}')}
              placeholder="${
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }"
            />
          }
        />`;

            case 'number':
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <Input
              type="number"
              {...register('${fieldName}')}
              placeholder="${
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }"
            />
          }
        />`;

            case 'textarea':
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <Textarea
              {...register('${fieldName}')}
              placeholder="${
                field.placeholder || `Enter ${field.label.toLowerCase()}`
              }"
              resize="vertical"
            />
          }
        />`;

            case 'select':
              return `        <SelectFieldWrapper
          name="${fieldName}"
          label="${field.label}"
          control={control}
          formState={formState}
          options={[${
            field.options?.map((opt) => `"${opt}"`).join(', ') || ''
          }]}
          isRequired={${field.required || false}}
          placeholder="${field.placeholder || 'Select an option'}"
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
        />`;

            case 'boolean':
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <Controller
              name="${fieldName}"
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
        />`;

            case 'radio':
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <Controller
              name="${fieldName}"
              control={control}
              render={({ field: controllerField }) => (
                <RadioGroup.Root
                  value={controllerField.value}
                  onValueChange={controllerField.onChange}
                >
                  <Stack direction="column">
                    ${
                      field.options
                        ?.map(
                          (
                            option
                          ) => `<RadioGroup.Item key="${option}" value="${option}">
                      <RadioGroup.ItemControl />
                      <RadioGroup.ItemText>${option}</RadioGroup.ItemText>
                    </RadioGroup.Item>`
                        )
                        .join('\n                    ') || ''
                    }
                  </Stack>
                </RadioGroup.Root>
              )}
            />
          }
        />`;

            case 'array':
              if (field.fields) {
                // Array of objects
                const subFields = field.fields
                  .map((subField) => {
                    switch (subField.type) {
                      case 'text':
                      case 'email':
                      case 'password':
                      case 'number':
                        return `                      <FieldWrapper
                        key={\`${fieldName}.\${index}.${subField.name}\`}
                        label="${subField.label}"
                        name={\`${fieldName}.\${index}.${subField.name}\`}
                        formState={formState}
                        isRequired={${subField.required || false}}
                        field={
                          <Input
                            type="${subField.type}"
                            {...register(\`${fieldName}.\${index}.${
                          subField.name
                        }\`)}
                            placeholder="${
                              subField.placeholder ||
                              `Enter ${subField.label.toLowerCase()}`
                            }"
                            size="sm"
                          />
                        }
                      />`;
                      case 'textarea':
                        return `                      <FieldWrapper
                        key={\`${fieldName}.\${index}.${subField.name}\`}
                        label="${subField.label}"
                        name={\`${fieldName}.\${index}.${subField.name}\`}
                        formState={formState}
                        isRequired={${subField.required || false}}
                        field={
                          <Textarea
                            {...register(\`${fieldName}.\${index}.${
                          subField.name
                        }\`)}
                            placeholder="${
                              subField.placeholder ||
                              `Enter ${subField.label.toLowerCase()}`
                            }"
                            size="sm"
                            resize="vertical"
                          />
                        }
                      />`;
                      case 'boolean':
                        return `                      <FieldWrapper
                        key={\`${fieldName}.\${index}.${subField.name}\`}
                        label="${subField.label}"
                        name={\`${fieldName}.\${index}.${subField.name}\`}
                        formState={formState}
                        isRequired={${subField.required || false}}
                        field={
                          <Controller
                            name={\`${fieldName}.\${index}.${subField.name}\`}
                            control={control}
                            render={({ field: controllerField }) => (
                              <Checkbox.Root
                                checked={controllerField.value}
                                onCheckedChange={(e) => controllerField.onChange(e.checked)}
                                size="sm"
                              >
                                {subField.label}
                              </Checkbox.Root>
                            )}
                          />
                        }
                      />`;
                      default:
                        return '';
                    }
                  })
                  .join('\n');

                return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <VStack align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  {${fieldName}Fields.length} item{${fieldName}Fields.length !== 1 ? 's' : ''}
                </Text>
                <Button
                  onClick={() => ${fieldName}Append({${field.fields
                  .map((sf) => {
                    let defaultVal = "''";
                    if (sf.type === 'boolean') defaultVal = 'false';
                    if (sf.type === 'number') defaultVal = '0';
                    return `${sf.name}: ${defaultVal}`;
                  })
                  .join(', ')}})}
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                >
                  Add ${field.label} Item
                </Button>
              </HStack>

              {${fieldName}Fields.map((item, index) => (
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
                      ${field.label} #{index + 1}
                    </Text>
                    <Button
                      onClick={() => ${fieldName}Remove(index)}
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </HStack>

                  <VStack align="stretch">
${subFields}
                  </VStack>
                </Box>
              ))}

              {${fieldName}Fields.length === 0 && (
                <Box p={6} bg="gray.100" borderRadius="md" textAlign="center">
                  <Text color="gray.500" fontSize="sm" fontStyle="italic">
                    No items added yet. Click "Add ${
                      field.label
                    } Item" to create the first item.
                  </Text>
                </Box>
              )}
            </VStack>
          }
        />`;
              } else {
                // Array of primitives
                return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ''}
          field={
            <VStack align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  {${fieldName}Fields.length} item{${fieldName}Fields.length !== 1 ? 's' : ''}
                </Text>
                <Button
                  onClick={() => ${fieldName}Append('')}
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                >
                  Add ${field.label} Item
                </Button>
              </HStack>

              {${fieldName}Fields.map((item, index) => (
                <HStack key={item.id}>
                  <Input
                    {...register(\`${fieldName}.\${index}\`)}
                    placeholder="${
                      field.placeholder || `Enter ${field.label.toLowerCase()}`
                    }"
                    size="sm"
                  />
                  <Button
                    onClick={() => ${fieldName}Remove(index)}
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                  >
                    Remove
                  </Button>
                </HStack>
              ))}

              {${fieldName}Fields.length === 0 && (
                <Box p={6} bg="gray.100" borderRadius="md" textAlign="center">
                  <Text color="gray.500" fontSize="sm" fontStyle="italic">
                    No items added yet. Click "Add ${
                      field.label
                    } Item" to create the first item.
                  </Text>
                </Box>
              )}
            </VStack>
          }
        />`;
              }

            default:
              return '';
          }
        })
        .join('\n\n');
    };

    const generateArrayHooks = () => {
      return config.fields
        .filter((field) => field.type === 'array')
        .map((field) => {
          return `  const { fields: ${field.name}Fields, append: ${field.name}Append, remove: ${field.name}Remove } = useFieldArray({
    control,
    name: '${field.name}',
  });`;
        })
        .join('\n');
    };

    return `import React from 'react';
import {
  useForm,
  useFieldArray,
  Controller,
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
} from '@chakra-ui/react';
import { FieldWrapper } from './FieldWrapper';
import { SelectFieldWrapper } from './SelectFieldWrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import { ${formName}Schema, type ${componentName}FormData } from './schema';

interface ${componentName}Props {
  onSubmit?: (data: ${componentName}FormData) => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({ onSubmit: onSubmitProp }) => {
  const { control, handleSubmit, register, formState } = useForm<${componentName}FormData>({
    resolver: zodResolver(${formName}Schema),
    defaultValues: {
${generateDefaultValues()}
    },
    mode: 'onChange',
  });

${generateArrayHooks()}

  const onSubmit = async (data: ${componentName}FormData) => {
    try {
      console.log('Form submitted:', data);
      if (onSubmitProp) {
        onSubmitProp(data);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color="gray.700" textAlign="center">
          ${config.title}
        </Heading>

${generateFieldComponents()}

        <Button
          onClick={handleSubmit(onSubmit)}
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={formState.isSubmitting}
          loadingText="Submitting..."
          mt={6}
        >
          Submit Form
        </Button>
      </VStack>
    </Box>
  );
};

export default ${componentName};`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'component':
        return generateComponentCode();
      case 'schema':
        return generateZodSchemaCode();
      case 'types':
        return generateTypesCode();
      default:
        return '';
    }
  };

  const getFileName = () => {
    const componentName = config.title.replace(/\s+/g, '');
    switch (activeTab) {
      case 'component':
        return `${componentName}.tsx`;
      case 'schema':
        return 'schema.ts';
      case 'types':
        return 'types.ts';
      default:
        return 'code.tsx';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Code className="w-6 h-6" />
          Generated Form Code
        </h2>
        <p className="text-gray-600">
          Copy the generated code for your form: <strong>{config.title}</strong>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('component')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'component'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Component
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'schema'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Schema
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'types'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Types
        </button>
      </div>

      {/* Code Display */}
      <div className="relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">{getFileName()}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(getActiveContent(), activeTab)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {copied === activeTab ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied === activeTab ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={() => downloadFile(getActiveContent(), getFileName())}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <pre className="text-sm text-gray-100 p-4 overflow-x-auto max-h-96">
            <code>{getActiveContent()}</code>
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">
          Implementation Instructions:
        </h4>
        <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
          <li>Copy the component code to create your form component</li>
          <li>Copy the schema code for validation</li>
          <li>
            Make sure you have your existing <code>FieldWrapper</code> and{' '}
            <code>SelectFieldWrapper</code> components
          </li>
          <li>
            Install required dependencies:{' '}
            <code>react-hook-form @hookform/resolvers zod</code>
          </li>
          <li>Import and use the form component in your application</li>
          <li>Handle form submission in the parent component</li>
        </ol>
      </div>

      {/* Usage Example */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">Usage Example:</h4>
        <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
          {`import ${config.title.replace(
            /\s+/g,
            ''
          )} from './${config.title.replace(/\s+/g, '')}';

function App() {
  const handleFormSubmit = (data) => {
    console.log('Form data:', data);
    // Handle form submission
  };

  return (
    <div>
      <${config.title.replace(/\s+/g, '')} onSubmit={handleFormSubmit} />
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
};

// Example usage component
const FormCodeDisplay = () => {
  const exampleConfig: FormConfig = {
    title: 'User Registration Form',
    fields: [
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        required: true,
        placeholder: 'Enter your first name',
        validation: { minLength: 2 },
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      },
      {
        name: 'age',
        type: 'number',
        label: 'Age',
        required: true,
        validation: { min: 18, max: 100 },
      },
      {
        name: 'country',
        type: 'select',
        label: 'Country',
        required: true,
        options: ['USA', 'Canada', 'UK', 'Australia'],
      },
      {
        name: 'isSubscribed',
        type: 'boolean',
        label: 'Subscribe to newsletter',
        required: false,
      },
      {
        name: 'skills',
        type: 'array',
        label: 'Skills',
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Skill Name',
            required: true,
          },
          {
            name: 'level',
            type: 'select',
            label: 'Proficiency Level',
            required: true,
            options: ['Beginner', 'Intermediate', 'Advanced'],
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <FormCodeGenerator config={exampleConfig} />
    </div>
  );
};

export default FormCodeDisplay;
