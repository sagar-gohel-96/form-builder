import { useState } from "react";
import { Button, Tabs, Textarea } from "@chakra-ui/react";
import DynamicForm from "./DynamicForm";
import Layout from "./Layout";
import FormCodeDisplay from "./FormCodeDisplay";

const FormBuilder = () => {
  const [jsonConfig, setJsonConfig] = useState("");
  const [parsedConfig, setParsedConfig] = useState(null);
  const [error, setError] = useState("");

  const handleGenerateForm = () => {
    try {
      const config = JSON.parse(jsonConfig);
      setParsedConfig(config);
      setError("");
    } catch (err) {
      setError("Invalid JSON format");
      setParsedConfig(null);
    }
  };

  const sampleJSON = `{
  "title": "User Registration Form",
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "label": "First Name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 50
      }
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "name": "age",
      "type": "number",
      "label": "Age",
      "required": true,
      "validation": {
        "min": 18,
        "max": 100
      }
    },
    {
      "name": "bio",
      "type": "textarea",
      "label": "Bio",
      "required": false
    },
    {
      "name": "newsletter",
      "type": "boolean",
      "label": "Subscribe to newsletter",
      "required": false
    },
    {
      "name": "role",
      "type": "radio",
      "label": "Role",
      "required": true,
      "options": ["Developer", "Designer", "Manager", "Other"]
    },
    {
      "name": "hobbies",
      "type": "array",
      "label": "Hobbies",
      "itemType": "text",
      "required": false
    },
    {
      "name": "addresses",
      "type": "array",
      "label": "Addresses",
      "required": false,
      "fields": [
        {
          "name": "street",
          "type": "text",
          "label": "Street",
          "required": true
        },
        {
          "name": "city",
          "type": "text",
          "label": "City",
          "required": true
        },
        {
          "name": "zipCode",
          "type": "text",
          "label": "ZIP Code",
          "required": true
        }
      ]
    }
  ]
}`;

  return (
    <Layout>
      <div className="!space-y-6 !p-6">
        <div>
          <h1 className="!text-2xl font-bold text-gray-900 dark:text-white">
            Form Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create dynamic forms from JSON configuration
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Textarea
                id="json-config"
                placeholder="Enter your JSON configuration here..."
                value={jsonConfig}
                onChange={(e: any) => setJsonConfig(e.target.value)}
                className="h-[420px] font-mono text-sm border border-2-gray p-2 my-2 rounded-sm"
              />
            </div>
            <div className="flex gap-2 !mt-2">
              <Button
                onClick={handleGenerateForm}
                className="border border-2-white px-2 bg-gray-500"
              >
                Generate Form
              </Button>
              <Button
                variant="outline"
                className="border border-2-white px-2 bg-gray-500"
                onClick={() => setJsonConfig(sampleJSON)}
              >
                Load Sample
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {parsedConfig ? (
              <Tabs.Root defaultValue="preview" className="w-full">
                <Tabs.List className="grid w-full grid-cols-2">
                  <Tabs.Trigger value="preview">Form Preview</Tabs.Trigger>
                  <Tabs.Trigger value="code">Generated Code</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="preview" className="p-6">
                  <DynamicForm config={parsedConfig} />
                </Tabs.Content>
                <Tabs.Content value="code" className="p-6">
                  <FormCodeDisplay config={parsedConfig} />
                </Tabs.Content>
              </Tabs.Root>
            ) : (
              <div className="!p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Generated Form
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No form generated yet. Enter JSON configuration and click
                  "Generate Form".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FormBuilder;
