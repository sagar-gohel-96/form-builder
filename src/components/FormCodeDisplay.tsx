import React, { useState } from "react";
import { Button, Clipboard, Tabs, Code } from "@chakra-ui/react";
import { FIELD_WRAPPER, SELECT_WRAPPER } from "../utils/componentsText";

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
  const [activeTab, setActiveTab] = useState<
    "component" | "schema" | "types" | string
  >("form-code");

  const requiredPackages = [
    {
      name: "@chakra-ui/react",
      version: "latest",
      description: "Simple, modular and accessible UI components",
    },
    {
      name: "@emotion/react",
      version: "latest",
      description: "Required peer dependency for Chakra UI",
    },
    {
      name: "@emotion/styled",
      version: "latest",
      description: "Required peer dependency for Chakra UI",
    },
    {
      name: "react-hook-form",
      version: "^7.53.0",
      description: "Form state management and validation",
    },
    {
      name: "@hookform/resolvers",
      version: "^3.9.0",
      description: "Resolver for Zod schema validation",
    },
    {
      name: "zod",
      version: "^3.23.8",
      description: "TypeScript-first schema validation",
    },
  ];

  // Generate Zod Schema Code
  const generateZodSchemaCode = () => {
    const generateFieldValidation = (field: FieldConfig): string => {
      let validation = "";

      switch (field.type) {
        case "text":
        case "email":
        case "password":
        case "textarea":
          validation = "z.string()";
          if (field.validation?.minLength) {
            validation += `.min(${field.validation.minLength}, "Minimum ${field.validation.minLength} characters required")`;
          }
          if (field.validation?.maxLength) {
            validation += `.max(${field.validation.maxLength}, "Maximum ${field.validation.maxLength} characters allowed")`;
          }
          if (field.type === "email") {
            validation += '.email("Invalid email format")';
          }
          if (field.validation?.pattern) {
            validation += `.regex(/${field.validation.pattern}/, "Invalid format")`;
          }
          break;
        case "number":
          validation = "z.coerce.number()";
          if (field.validation?.min !== undefined) {
            validation += `.min(${field.validation.min}, "Minimum value is ${field.validation.min}")`;
          }
          if (field.validation?.max !== undefined) {
            validation += `.max(${field.validation.max}, "Maximum value is ${field.validation.max}")`;
          }
          break;
        case "boolean":
          validation = "z.boolean()";
          break;
        case "select":
        case "radio":
          if (field.options && field.options.length > 0) {
            validation = `z.enum([${field.options
              .map((opt) => `"${opt}"`)
              .join(", ")}])`;
          } else {
            validation = "z.string()";
          }
          break;
        case "array":
          if (field.fields) {
            const objectFields = field.fields
              .map(
                (subField) =>
                  `    ${subField.name}: ${generateFieldValidation(subField)}`
              )
              .join(",\n");
            validation = `z.array(z.object({\n${objectFields}\n  }))`;
          } else {
            validation = "z.array(z.string())";
          }
          break;
        default:
          validation = "z.string()";
      }

      if (!field.required) {
        validation += ".optional()";
      }

      return validation;
    };

    return `import { z } from 'zod';

export const ${config.title
      .replace(/\s+/g, "")
      .toLowerCase()}Schema = z.object({
${config.fields
  .map((field) => `  ${field.name}: ${generateFieldValidation(field)}`)
  .join(",\n")}
});

export type ${config.title.replace(
      /\s+/g,
      ""
    )}FormData = z.infer<typeof ${config.title
      .replace(/\s+/g, "")
      .toLowerCase()}Schema>;`;
  };

  // Generate Types Code
  const generateTypesCode = () => {
    return `export interface ${config.title.replace(/\s+/g, "")}FormData {
${config.fields
  .map((field) => {
    let type = "string";
    switch (field.type) {
      case "number":
        type = "number";
        break;
      case "boolean":
        type = "boolean";
        break;
      case "select":
      case "radio":
        if (field.options && field.options.length > 0) {
          type = field.options.map((opt) => `"${opt}"`).join(" | ");
        }
        break;
      case "array":
        if (field.fields) {
          const subTypes = field.fields
            .map((subField) => {
              let subType = "string";
              if (subField.type === "number") subType = "number";
              if (subField.type === "boolean") subType = "boolean";
              return `${subField.name}: ${subType}`;
            })
            .join("; ");
          type = `Array<{ ${subTypes} }>`;
        } else {
          type = "string[]";
        }
        break;
    }
    return `  ${field.name}${field.required ? "" : "?"}: ${type};`;
  })
  .join("\n")}
}`;
  };

  // Generate Main Component Code
  const generateComponentCode = () => {
    const componentName = config.title.replace(/\s+/g, "");
    const formName = config.title.replace(/\s+/g, "").toLowerCase();

    const generateDefaultValues = () => {
      const defaults = config.fields
        .map((field) => {
          let defaultValue = "''";
          switch (field.type) {
            case "boolean":
              defaultValue = "false";
              break;
            case "array":
              defaultValue = "[]";
              break;
            case "number":
              defaultValue = "undefined";
              break;
          }
          return `    ${field.name}: ${defaultValue}`;
        })
        .join(",\n");
      return defaults;
    };

    const generateFieldComponents = () => {
      return config.fields
        .map((field) => {
          const fieldName = field.name;

          switch (field.type) {
            case "text":
            case "email":
            case "password":
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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

            case "number":
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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

            case "textarea":
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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

            case "select":
              return `        <SelectFieldWrapper
          name="${fieldName}"
          label="${field.label}"
          control={control}
          formState={formState}
          options={[${
            field.options?.map((opt) => `"${opt}"`).join(", ") || ""
          }]}
          isRequired={${field.required || false}}
          placeholder="${field.placeholder || "Select an option"}"
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
        />`;

            case "boolean":
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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

            case "radio":
              return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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
                        .join("\n                    ") || ""
                    }
                  </Stack>
                </RadioGroup.Root>
              )}
            />
          }
        />`;

            case "array":
              if (field.fields) {
                // Array of objects
                const subFields = field.fields
                  .map((subField) => {
                    switch (subField.type) {
                      case "text":
                      case "email":
                      case "password":
                      case "number":
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
                      case "textarea":
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
                      case "boolean":
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
                        return "";
                    }
                  })
                  .join("\n");

                return `        <FieldWrapper
          label="${field.label}"
          name="${fieldName}"
          formState={formState}
          isRequired={${field.required || false}}
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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
                    if (sf.type === "boolean") defaultVal = "false";
                    if (sf.type === "number") defaultVal = "0";
                    return `${sf.name}: ${defaultVal}`;
                  })
                  .join(", ")}})}
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
          ${field.helperText ? `helperText="${field.helperText}"` : ""}
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
              return "";
          }
        })
        .join("\n\n");
    };

    const generateArrayHooks = () => {
      return config.fields
        .filter((field) => field.type === "array")
        .map((field) => {
          return `  const { fields: ${field.name}Fields, append: ${field.name}Append, remove: ${field.name}Remove } = useFieldArray({
    control,
    name: '${field.name}',
  });`;
        })
        .join("\n");
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 rounded-lg shadow-lg">
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        className="w-full"
      >
        <Tabs.List className="grid w-full grid-cols-4">
          <Tabs.Trigger value="form-code">Form Code</Tabs.Trigger>
          <Tabs.Trigger value="components">Components</Tabs.Trigger>
          <Tabs.Trigger value="schema">Schema</Tabs.Trigger>
          <Tabs.Trigger value="types">Types</Tabs.Trigger>
          <Tabs.Trigger value="setup">Setup</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="form-code">
          <div className="flex justify-between items-center !p-2 !mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">Form Code</h2>
              <p className="text-gray-600 mb-4">
                Copy the generated code for your form:{" "}
                <strong>{config.title}</strong>
              </p>
            </div>
            <Clipboard.Root value={generateComponentCode()} timeout={1000}>
              <Clipboard.Trigger asChild>
                <Button variant="surface" size="sm">
                  <Clipboard.Indicator />
                  <Clipboard.CopyText />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </div>
          <div className="h-80 overflow-auto">
            <pre>
              <Code size={"lg"} className="!p-6 w-full overflow-auto ">
                {generateComponentCode()}
              </Code>
            </pre>
          </div>
        </Tabs.Content>

        <Tabs.Content value="components">
          <div className="flex justify-between items-center !p-2 !mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                FieldWrapper Component
              </h2>
              <p className="text-gray-600 mb-4">Copy the components.</p>
            </div>
            <Clipboard.Root value={FIELD_WRAPPER} timeout={1000}>
              <Clipboard.Trigger asChild>
                <Button variant="surface" size="sm">
                  <Clipboard.Indicator />
                  <Clipboard.CopyText />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </div>
          <div className="h-80 overflow-auto">
            <pre>
              <Code size={"lg"} className="!p-6 w-full overflow-auto ">
                {FIELD_WRAPPER}
              </Code>
            </pre>
          </div>

          <div className="flex justify-between items-center !p-2 !mb-4 !mt-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                SelectFieldWrapper Component
              </h2>
              <p className="text-gray-600 mb-4">Copy the components.</p>
            </div>
            <Clipboard.Root value={SELECT_WRAPPER} timeout={1000}>
              <Clipboard.Trigger asChild>
                <Button variant="surface" size="sm">
                  <Clipboard.Indicator />
                  <Clipboard.CopyText />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </div>
          <div className="h-80 overflow-auto">
            <pre>
              <Code size={"lg"} className="!p-6 w-full overflow-auto ">
                {SELECT_WRAPPER}
              </Code>
            </pre>
          </div>
        </Tabs.Content>

        <Tabs.Content value="schema">
          <div className="flex justify-between items-center !p-2 !mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">Zod Schema</h2>
              <p className="text-gray-600 mb-4">
                Copy the generated Zod schema for validation.
              </p>
            </div>
            <Clipboard.Root value={generateZodSchemaCode()} timeout={1000}>
              <Clipboard.Trigger asChild>
                <Button variant="surface" size="sm">
                  <Clipboard.Indicator />
                  <Clipboard.CopyText />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </div>
          <div className="h-80 overflow-auto">
            <pre>
              <Code size={"lg"} className="!p-6 w-full overflow-auto ">
                {generateZodSchemaCode()}
              </Code>
            </pre>
          </div>
        </Tabs.Content>

        <Tabs.Content value="types">
          <div className="flex justify-between items-center !p-2 !mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">Types</h2>
              <p className="text-gray-600 mb-4">
                Copy the generated TypeScript types.
              </p>
            </div>
            <Clipboard.Root value={generateTypesCode()} timeout={1000}>
              <Clipboard.Trigger asChild>
                <Button variant="surface" size="sm">
                  <Clipboard.Indicator />
                  <Clipboard.CopyText />
                </Button>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </div>
          <div className="h-80 overflow-auto">
            <pre>
              <Code size={"lg"} className="!p-6 w-full overflow-auto ">
                {generateTypesCode()}
              </Code>
            </pre>
          </div>
        </Tabs.Content>

        <Tabs.Content value="setup" className="!p-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Required Packages</h3>
            </div>
            <div className="space-y-3">
              {requiredPackages.map((pkg, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg !p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {pkg.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {pkg.description}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                        npm install {pkg.name}@{pkg.version}
                      </code>
                    </div>
                    <Clipboard.Root
                      value={`npm install ${pkg.name}`}
                      timeout={1000}
                    >
                      <Clipboard.Trigger asChild>
                        <Button variant="surface" size="sm">
                          <Clipboard.Indicator />
                          <Clipboard.CopyText />
                        </Button>
                      </Clipboard.Trigger>
                    </Clipboard.Root>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

// Example usage component
const FormCodeDisplay = ({ config }: { config: FormConfig }) => {
  return (
    <div className="min-h-screen py-8">
      <FormCodeGenerator config={config} />
    </div>
  );
};

export default FormCodeDisplay;
