import type { FieldConfig } from "@/components/DynamicForm";
import * as z from "zod";

const generateZodSchema = (fields: FieldConfig[]): z.ZodType<any> => {
  const schemaFields: any = {};

  fields.forEach((field) => {
    let fieldSchema: any;

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "textarea":
        fieldSchema = z.string();
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength, {
            message: `Minimum ${field.validation.minLength} characters required`,
          });
        }
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength, {
            message: `Maximum ${field.validation.maxLength} characters allowed`,
          });
        }
        if (field.type === "email") {
          fieldSchema = fieldSchema.email({
            message: "Please enter a valid email address",
          });
        }
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(
            new RegExp(field.validation.pattern),
            {
              message: "Please enter a valid format",
            }
          );
        }
        break;
      case "number":
        fieldSchema = z.coerce.number({
          error: "Please enter a valid number",
        });
        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validation.min, {
            message: `Minimum value is ${field.validation.min}`,
          });
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validation.max, {
            message: `Maximum value is ${field.validation.max}`,
          });
        }
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "select":
      case "radio":
        fieldSchema = z.string();
        break;
      case "array":
        if (field.fields) {
          fieldSchema = z.array(generateZodSchema(field.fields));
        } else {
          fieldSchema = z.array(z.string().min(1, "This field is required"));
        }

        if (field.required) {
          fieldSchema = fieldSchema.min(
            1,
            `At least one ${field.label.toLowerCase()} is required`
          );
        } else {
          fieldSchema = fieldSchema.min(0);
        }
        break;
      default:
        fieldSchema = z.string();
    }

    // Handle required fields
    if (!field.required && field.type !== "array") {
      fieldSchema = fieldSchema.optional();
    } else if (
      field.required &&
      field.type !== "boolean" &&
      field.type !== "array"
    ) {
      if (
        field.type === "string" ||
        field.type === "text" ||
        field.type === "email" ||
        field.type === "password" ||
        field.type === "textarea"
      ) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }
    } else if (field.required && field.type === "boolean") {
      fieldSchema = fieldSchema.refine((val: any) => val === true, {
        message: `${field.label} must be checked`,
      });
    }

    schemaFields[field.name] = fieldSchema;
  });

  return z.object(schemaFields);
};
export default generateZodSchema;
