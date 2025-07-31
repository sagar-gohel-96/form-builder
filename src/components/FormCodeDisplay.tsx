import { Button, Tabs, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { BiCopy } from "react-icons/bi";

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
}

interface FormConfig {
  title: string;
  fields: FieldConfig[];
}

interface FormCodeDisplayProps {
  config: FormConfig;
}

export const FormCodeDisplay = ({ config }: FormCodeDisplayProps) => {
  //   const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("form-code");

  const generateFormCode = () => {
    const generateZodSchema = (fields: FieldConfig[]): string => {
      const schemaFields = fields
        .map((field) => {
          let fieldSchema = "";

          switch (field.type) {
            case "text":
            case "email":
            case "password":
              fieldSchema = "z.string()";
              if (field.validation?.minLength) {
                fieldSchema += `.min(${field.validation.minLength})`;
              }
              if (field.validation?.maxLength) {
                fieldSchema += `.max(${field.validation.maxLength})`;
              }
              if (field.type === "email") {
                fieldSchema += ".email()";
              }
              break;
            case "number":
              fieldSchema = "z.number()";
              if (field.validation?.min !== undefined) {
                fieldSchema += `.min(${field.validation.min})`;
              }
              if (field.validation?.max !== undefined) {
                fieldSchema += `.max(${field.validation.max})`;
              }
              break;
            case "boolean":
              fieldSchema = "z.boolean()";
              break;
            case "array":
              if (field.fields) {
                const subSchema = generateZodSchema(field.fields);
                fieldSchema = `z.array(z.object({${subSchema}}))`;
              } else {
                fieldSchema = "z.array(z.string())";
              }
              break;
            default:
              fieldSchema = "z.string()";
          }

          if (!field.required) {
            fieldSchema += ".optional()";
          }

          return `  ${field.name}: ${fieldSchema}`;
        })
        .join(",\n");

      return schemaFields;
    };

    const generateFieldComponents = (
      fields: FieldConfig[],
      indent = "      "
    ): string => {
      return fields
        .map((field) => {
          switch (field.type) {
            case "text":
            case "email":
            case "password":
              return `${indent}<FormField
${indent}  control={form.control}
${indent}  name="${field.name}"
${indent}  render={({ field }) => (
${indent}    <FormItem>
${indent}      <FormLabel>${field.label}</FormLabel>
${indent}      <FormControl>
${indent}        <Input type="${
                field.type
              }" placeholder="Enter ${field.label.toLowerCase()}" {...field} />
${indent}      </FormControl>
${indent}      <FormMessage />
${indent}    </FormItem>
${indent}  )}
${indent}/>`;

            case "number":
              return `${indent}<FormField
${indent}  control={form.control}
${indent}  name="${field.name}"
${indent}  render={({ field }) => (
${indent}    <FormItem>
${indent}      <FormLabel>${field.label}</FormLabel>
${indent}      <FormControl>
${indent}        <Input type="number" placeholder="Enter ${field.label.toLowerCase()}" {...field} />
${indent}      </FormControl>
${indent}      <FormMessage />
${indent}    </FormItem>
${indent}  )}
${indent}/>`;

            case "textarea":
              return `${indent}<FormField
${indent}  control={form.control}
${indent}  name="${field.name}"
${indent}  render={({ field }) => (
${indent}    <FormItem>
${indent}      <FormLabel>${field.label}</FormLabel>
${indent}      <FormControl>
${indent}        <Textarea placeholder="Enter ${field.label.toLowerCase()}" {...field} />
${indent}      </FormControl>
${indent}      <FormMessage />
${indent}    </FormItem>
${indent}  )}
${indent}/>`;

            case "boolean":
              return `${indent}<FormField
${indent}  control={form.control}
${indent}  name="${field.name}"
${indent}  render={({ field }) => (
${indent}    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
${indent}      <FormControl>
${indent}        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
${indent}      </FormControl>
${indent}      <div className="space-y-1 leading-none">
${indent}        <FormLabel>${field.label}</FormLabel>
${indent}      </div>
${indent}    </FormItem>
${indent}  )}
${indent}/>`;

            case "radio":
              return `${indent}<FormField
${indent}  control={form.control}
${indent}  name="${field.name}"
${indent}  render={({ field }) => (
${indent}    <FormItem className="space-y-3">
${indent}      <FormLabel>${field.label}</FormLabel>
${indent}      <FormControl>
${indent}        <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
${field.options
  ?.map(
    (option) =>
      `${indent}          <div className="flex items-center space-x-2">
${indent}            <RadioGroupItem value="${option}" id="${option}" />
${indent}            <Label htmlFor="${option}">${option}</Label>
${indent}          </div>`
  )
  .join("\n")}
${indent}        </RadioGroup>
${indent}      </FormControl>
${indent}      <FormMessage />
${indent}    </FormItem>
${indent}  )}
${indent}/>`;

            case "array":
              if (field.fields) {
                return `${indent}<div className="space-y-4">
${indent}  <Label className="text-base font-medium">${field.label}</Label>
${indent}  <FormField
${indent}    control={form.control}
${indent}    name="${field.name}"
${indent}    render={({ field }) => (
${indent}      <FormItem>
${indent}        <FormControl>
${indent}          <div className="space-y-4">
${indent}            {field.value?.map((item, index) => (
${indent}              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
${indent}                <div className="flex justify-between items-center">
${indent}                  <h4 className="font-medium">${
                  field.label
                } #{index + 1}</h4>
${indent}                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
${indent}                    Remove
${indent}                  </Button>
${indent}                </div>
${generateFieldComponents(field.fields, indent + "                ")}
${indent}              </div>
${indent}            ))}
${indent}            <Button type="button" variant="outline" onClick={() => append({})}>
${indent}              Add ${field.label}
${indent}            </Button>
${indent}          </div>
${indent}        </FormControl>
${indent}      </FormItem>
${indent}    )}
${indent}  />
${indent}</div>`;
              } else {
                return `${indent}<div className="space-y-4">
${indent}  <Label className="text-base font-medium">${field.label}</Label>
${indent}  <FormField
${indent}    control={form.control}
${indent}    name="${field.name}"
${indent}    render={({ field }) => (
${indent}      <FormItem>
${indent}        <FormControl>
${indent}          <div className="space-y-2">
${indent}            {field.value?.map((item, index) => (
${indent}              <div key={index} className="flex gap-2">
${indent}                <Input value={item} onChange={(e) => {
${indent}                  const newValue = [...field.value];
${indent}                  newValue[index] = e.target.value;
${indent}                  field.onChange(newValue);
${indent}                }} />
${indent}                <Button type="button" variant="destructive" size="sm" onClick={() => {
${indent}                  const newValue = field.value.filter((_, i) => i !== index);
${indent}                  field.onChange(newValue);
${indent}                }}>
${indent}                  Remove
${indent}                </Button>
${indent}              </div>
${indent}            ))}
${indent}            <Button type="button" variant="outline" onClick={() => field.onChange([...field.value, ''])}>
${indent}              Add ${field.label}
${indent}            </Button>
${indent}          </div>
${indent}        </FormControl>
${indent}      </FormItem>
${indent}    )}
${indent}  />
${indent}</div>`;
              }

            default:
              return "";
          }
        })
        .join("\n\n");
    };

    return `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChakraProvider, Box, VStack, Button, Input, FormControl, FormLabel, Textarea, Checkbox, RadioGroup, Radio, Stack } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';

// Form Schema
const formSchema = z.object({
${generateZodSchema(config.fields)}
});

type FormData = z.infer<typeof formSchema>;

const ${config.title.replace(/[^a-zA-Z0-9]/g, "")}Form = () => {
  const toast = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    toast({
      title: "Form Submitted",
      description: "Check console for form data",
      status: "success",
    });
  };

  return (
    <ChakraProvider>
      <Box maxWidth="2xl" mx="auto" p={6}>
        <Box as="h1" fontSize="2xl" fontWeight="bold" mb={6}>${
          config.title
        }</Box>
        
        <Box as="form" onSubmit={form.handleSubmit(onSubmit)}>
          <VStack spacing={6}>
${generateFieldComponents(config.fields)}
            
            <Button type="submit" width="full" colorScheme="blue">
              Submit Form
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default ${config.title.replace(/[^a-zA-Z0-9]/g, "")}Form;`;
  };

  const formCode = generateFormCode();

  const requiredComponents = [
    {
      name: "Button, Input, FormControl, FormLabel, Textarea, Checkbox, RadioGroup, Radio, Stack, Box, VStack",
      path: "@chakra-ui/react",
      description: "Chakra UI components for form elements",
    },
    {
      name: "ChakraProvider",
      path: "@chakra-ui/react",
      description: "Chakra UI provider component for theming",
    },
  ];

  const requiredHooks = [
    {
      name: "useToast",
      path: "@chakra-ui/react",
      description: "Chakra UI toast notification hook",
    },
  ];

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

  const componentCodes = {
    Button: `import React from 'react';
import { Button as ChakraButton } from '@chakra-ui/react';

interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  colorScheme?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = 'md',
  colorScheme = 'blue',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <ChakraButton
      variant={variant}
      size={size}
      colorScheme={colorScheme}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </ChakraButton>
  );
};

export { Button };`,

    Input: `import React from 'react';
import { Input as ChakraInput, FormControl, FormLabel } from '@chakra-ui/react';

interface InputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  disabled?: boolean
  required?: boolean
  label?: string
  id?: string
  name?: string
  className?: string
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  required = false,
  label,
  id,
  name,
  className,
  ...props
}) => {
  return (
    <FormControl>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      <ChakraInput
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        disabled={disabled}
        required={required}
        className={className}
        {...props}
      />
    </FormControl>
  );
};

export { Input };`,

    Label: `import React from 'react';
import { FormLabel } from '@chakra-ui/react';

interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  className,
  ...props
}) => {
  return (
    <FormLabel
      htmlFor={htmlFor}
      requiredIndicator={required ? '*' : undefined}
      className={className}
      {...props}
    >
      {children}
    </FormLabel>
  );
};

export { Label };`,

    Textarea: `import React from 'react';
import { Textarea as ChakraTextarea, FormControl, FormLabel } from '@chakra-ui/react';

interface TextareaProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  required?: boolean
  label?: string
  id?: string
  name?: string
  rows?: number
  className?: string
}

const Textarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  label,
  id,
  name,
  rows = 4,
  className,
  ...props
}) => {
  return (
    <FormControl>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      <ChakraTextarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        rows={rows}
        className={className}
        {...props}
      />
    </FormControl>
  );
};

export { Textarea };`,

    Checkbox: `import React from 'react';
import { Checkbox as ChakraCheckbox, FormControl, FormLabel } from '@chakra-ui/react';

interface CheckboxProps {
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  label?: string
  id?: string
  name?: string
  value?: string
  colorScheme?: string
  className?: string
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  required = false,
  label,
  id,
  name,
  value,
  colorScheme = 'blue',
  className,
  ...props
}) => {
  return (
    <FormControl>
      <ChakraCheckbox
        id={id}
        name={name}
        value={value}
        isChecked={checked}
        onChange={onChange}
        isDisabled={disabled}
        isRequired={required}
        colorScheme={colorScheme}
        className={className}
        {...props}
      >
        {label}
      </ChakraCheckbox>
    </FormControl>
  );
};

export { Checkbox };`,

    RadioGroup: `import React from 'react';
import { 
  RadioGroup as ChakraRadioGroup, 
  Radio, 
  FormControl, 
  FormLabel,
  Stack 
} from '@chakra-ui/react';

interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

interface RadioGroupProps {
  value?: string
  onChange?: (value: string) => void
  options: RadioOption[]
  label?: string
  disabled?: boolean
  required?: boolean
  colorScheme?: string
  direction?: 'row' | 'column'
  className?: string
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  label,
  disabled = false,
  required = false,
  colorScheme = 'blue',
  direction = 'column',
  className,
  ...props
}) => {
  return (
    <FormControl>
      {label && <FormLabel>{label}</FormLabel>}
      <ChakraRadioGroup
        value={value}
        onChange={onChange}
        isDisabled={disabled}
        isRequired={required}
        className={className}
        {...props}
      >
        <Stack direction={direction}>
          {options.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              colorScheme={colorScheme}
              isDisabled={option.disabled || disabled}
            >
              {option.label}
            </Radio>
          ))}
        </Stack>
      </ChakraRadioGroup>
    </FormControl>
  );
};

export { RadioGroup };`,

    Form: `import React from 'react';
import { Box, VStack } from '@chakra-ui/react';

interface FormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  className?: string
}

const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className,
  ...props
}) => {
  return (
    <Box as="form" onSubmit={onSubmit} className={className} {...props}>
      <VStack spacing={4} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({ children, className }) => {
  return (
    <Box className={className}>
      {children}
    </Box>
  );
};

export { Form, FormField };`,

    useToast: `import { useToast as useChakraToast } from '@chakra-ui/react';

interface ToastOptions {
  title?: string
  description?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  isClosable?: boolean
  position?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'
}

const useToast = () => {
  const chakraToast = useChakraToast();

  const toast = ({
    title,
    description,
    status = 'info',
    duration = 3000,
    isClosable = true,
    position = 'top'
  }: ToastOptions) => {
    return chakraToast({
      title,
      description,
      status,
      duration,
      isClosable,
      position
    });
  };

  return { toast };
};

export { useToast };`,
  };

  const copyToClipboard = (text: string, title: string) => {
    console.log(title);
    navigator.clipboard.writeText(text);
    // toast({
    //   title: `${title} Copied`,
    //   description: `${title} has been copied to clipboard`,
    // });
  };

  const copyFormCode = () => {
    copyToClipboard(formCode, "Form Code");
  };

  const copyComponentImports = () => {
    const imports = requiredComponents
      .map((comp) => `import { ${comp.name} } from '${comp.path}';`)
      .join("\n");
    copyToClipboard(imports, "Component Imports");
  };

  const copyPackageInstall = () => {
    const packages = requiredPackages.map((pkg) => pkg.name).join(" ");
    const installCommand = `npm install ${packages}`;
    copyToClipboard(installCommand, "Install Command");
  };

  return (
    <>
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        className="w-full"
      >
        <Tabs.List className="grid w-full grid-cols-4">
          <Tabs.Trigger value="form-code">Form Code</Tabs.Trigger>
          <Tabs.Trigger value="components">Components</Tabs.Trigger>
          <Tabs.Trigger value="component-code">Component Code</Tabs.Trigger>
          <Tabs.Trigger value="setup">Setup</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="form-code" className="space-y-4">
          <div className="flex justify-between items-center">
            {/* <Label className="text-base font-medium">Generated Form Code</Label> */}
            <Button onClick={copyFormCode} size="sm" variant="outline">
              <BiCopy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>
          <Textarea
            value={formCode}
            readOnly
            className="min-h-[600px] font-mono text-xs"
          />
        </Tabs.Content>

        <Tabs.Content value="components" className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Required UI Components</h3>
              <Button
                onClick={copyComponentImports}
                size="sm"
                variant="outline"
              >
                <BiCopy className="h-4 w-4 mr-2" />
                Copy All Imports
              </Button>
            </div>
            <div className="space-y-3">
              {requiredComponents.map((component, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {component.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {component.description}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                        import {`{ ${component.name} }`} from '{component.path}
                        ';
                      </code>
                    </div>
                    <Button
                      onClick={() =>
                        copyToClipboard(
                          `import { ${component.name} } from '${component.path}';`,
                          "Import"
                        )
                      }
                      size="sm"
                      variant="ghost"
                    >
                      <BiCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Required Hooks</h3>
            <div className="space-y-3">
              {requiredHooks.map((hook, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {hook.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {hook.description}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                        import {`{ ${hook.name} }`} from '{hook.path}';
                      </code>
                    </div>
                    <Button
                      onClick={() =>
                        copyToClipboard(
                          `import { ${hook.name} } from '${hook.path}';`,
                          "Import"
                        )
                      }
                      size="sm"
                      variant="ghost"
                    >
                      <BiCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="component-code" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Complete Component Source Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Here's the complete source code for each UI component used in the
              generated form. You can copy these files directly to your project.
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Button Component</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(componentCodes.Button, "Button Component")
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Button}
                  readOnly
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Input Component</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(componentCodes.Input, "Input Component")
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Input}
                  readOnly
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Label Component</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(componentCodes.Label, "Label Component")
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Label}
                  readOnly
                  className="min-h-[150px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Textarea Component</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        componentCodes.Textarea,
                        "Textarea Component"
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Textarea}
                  readOnly
                  className="min-h-[150px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Checkbox Component</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        componentCodes.Checkbox,
                        "Checkbox Component"
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Checkbox}
                  readOnly
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Radio Group Components</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        componentCodes.RadioGroup,
                        "Radio Group Components"
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.RadioGroup}
                  readOnly
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Form Components</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(componentCodes.Form, "Form Components")
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.Form}
                  readOnly
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">useToast Hook</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(componentCodes.useToast, "useToast Hook")
                    }
                    size="sm"
                    variant="outline"
                  >
                    <BiCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={componentCodes.useToast}
                  readOnly
                  className="min-h-[100px] font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="setup" className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Required Packages</h3>
              <Button onClick={copyPackageInstall} size="sm" variant="outline">
                <BiCopy className="h-4 w-4 mr-2" />
                Copy Install Command
              </Button>
            </div>
            <div className="space-y-3">
              {requiredPackages.map((pkg, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
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
                    <Button
                      onClick={() =>
                        copyToClipboard(
                          `npm install ${pkg.name}`,
                          "Install Command"
                        )
                      }
                      size="sm"
                      variant="ghost"
                    >
                      <BiCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Complete Setup Command
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Install all required packages at once:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <code className="text-sm">
                npm install react-hook-form @hookform/resolvers zod
              </code>
            </div>
          </div>

          <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
              ⚠️ UI Components Setup
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              The UI components used in this form are from shadcn/ui. You'll
              need to install and configure shadcn/ui in your project first.
              Visit{" "}
              <a
                href="https://ui.shadcn.com/docs/installation"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                shadcn/ui documentation
              </a>{" "}
              for setup instructions.
            </p>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};
