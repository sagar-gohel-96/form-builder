export const generateFormCodeFromConfig = (config: any): string => {
  const indent = (level = 2) => " ".repeat(level);

  const generateFieldCode = (field: any, path = ""): string => {
    const fieldName = path ? `${path}.${field.name}` : field.name;
    const label = field.label || field.name;
    const isRequired = field.required ? "isRequired" : "";
    const placeholder = field.placeholder
      ? ` placeholder="${field.placeholder}"`
      : ` placeholder="Enter ${label.toLowerCase()}"`;
    const helperText = field.helperText
      ? ` helperText="${field.helperText}"`
      : "";

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "number":
        return `${indent(2)}<FieldWrapper\n${indent(
          4
        )}key="${fieldName}"\n${indent(4)}label="${label}"\n${indent(
          4
        )}name="${fieldName}"\n${indent(4)}formState={formState}\n${indent(
          4
        )}${isRequired}\n${indent(4)}${helperText}\n${indent(
          4
        )}field={\n${indent(6)}<Input type="${
          field.type
        }" {...register("${fieldName}")}${placeholder} />\n${indent(
          4
        )}}\n${indent(2)}/>`;

      case "textarea":
        return `${indent(2)}<FieldWrapper\n${indent(
          4
        )}key="${fieldName}"\n${indent(4)}label="${label}"\n${indent(
          4
        )}name="${fieldName}"\n${indent(4)}formState={formState}\n${indent(
          4
        )}${isRequired}\n${indent(4)}${helperText}\n${indent(
          4
        )}field={\n${indent(
          6
        )}<Textarea {...register("${fieldName}")}${placeholder} resize="vertical" />\n${indent(
          4
        )}}\n${indent(2)}/>`;

      case "select":
        return `${indent(2)}<SelectFieldWrapper\n${indent(
          4
        )}name="${fieldName}"\n${indent(4)}label="${label}"\n${indent(
          4
        )}control={control}\n${indent(4)}formState={formState}\n${indent(
          4
        )}options={[]}\n${indent(4)}${isRequired}\n${indent(
          4
        )}${placeholder}\n${indent(4)}${helperText}\n${indent(2)}/>`;

      case "boolean":
        return `${indent(2)}<FieldWrapper\n${indent(
          4
        )}key="${fieldName}"\n${indent(4)}label="${label}"\n${indent(
          4
        )}name="${fieldName}"\n${indent(4)}formState={formState}\n${indent(
          4
        )}${isRequired}\n${indent(4)}${helperText}\n${indent(
          4
        )}field={\n${indent(6)}<Controller\n${indent(
          8
        )}name="${fieldName}"\n${indent(8)}control={control}\n${indent(
          8
        )}render={({ field: controllerField }) => (\n${indent(
          10
        )}<Checkbox checked={controllerField.value} onChange={controllerField.onChange}>\n${indent(
          12
        )}${label}\n${indent(10)}</Checkbox>\n${indent(8)})}\n${indent(
          6
        )}/>\n${indent(4)}}\n${indent(2)}/>`;

      case "radio":
        return `${indent(2)}<FieldWrapper\n${indent(
          4
        )}key="${fieldName}"\n${indent(4)}label="${label}"\n${indent(
          4
        )}name="${fieldName}"\n${indent(4)}formState={formState}\n${indent(
          4
        )}${isRequired}\n${indent(4)}${helperText}\n${indent(
          4
        )}field={\n${indent(6)}<Controller\n${indent(
          8
        )}name="${fieldName}"\n${indent(8)}control={control}\n${indent(
          8
        )}render={({ field: controllerField }) => (\n${indent(
          10
        )}<RadioGroup value={controllerField.value} onChange={controllerField.onChange}>\n${indent(
          12
        )}{/* Radio options */}\n${indent(10)}</RadioGroup>\n${indent(
          8
        )})}\n${indent(6)}/>\n${indent(4)}}\n${indent(2)}/>`;

      case "array":
        if (field.fields && field.fields.length > 0) {
          const nestedFields = field.fields
            .map((subField: any) =>
              generateFieldCode(subField, `${fieldName}[\${index}]`)
            )
            .join("\n\n");
          return `${indent(2)}{/* Array Field: ${label} */}\n${indent(
            2
          )}{fields.${field.name}.map((item, index) => (\n${indent(
            4
          )}<Box key={item.id}>\n${nestedFields}\n${indent(4)}</Box>\n${indent(
            2
          )}))}`;
        } else {
          return `${indent(
            2
          )}{/* Array Field: ${label} (primitive values) */}\n${indent(
            2
          )}{fields.${field.name}.map((item, index) => (\n${indent(
            4
          )}<FieldWrapper\n${indent(6)}key={item.id}\n${indent(
            6
          )}label="${label} #\${index + 1}"\n${indent(
            6
          )}name="${fieldName}[\${index}]"\n${indent(
            6
          )}formState={formState}\n${indent(
            6
          )}field={<Input {...register("${fieldName}[\${index}]")}${placeholder} />}\n${indent(
            4
          )}/>\n${indent(2)}))}`;
        }

      default:
        return `${indent(2)}{/* Unsupported field type: "${
          field.type
        }" for field "${fieldName}" */}`;
    }
  };

  const fieldsCode = config.fields
    .map((field: any) => generateFieldCode(field))
    .join("\n\n");

  return `import { Input, Textarea, Checkbox, Box } from "@chakra-ui/react";\nimport { FieldWrapper } from "./FieldWrapper";\nimport { SelectFieldWrapper } from "./SelectFieldWrapper";\nimport { Controller } from "react-hook-form";\n\nconst Form = ({ register, control, formState, fields }) => (\n${indent()}<form>\n${fieldsCode}\n${indent()}</form>\n);\n\nexport default Form;`;
};
