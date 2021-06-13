const Ajv = require("ajv");
const { stringify } = require("yaml");
const {
  structureAJVErrorArray,
  summarizeAJVErrorTree,
} = require("../lib/main.js");
const ajv = new Ajv({ verbose: true });
const schema = {
  type: "object",
  properties: {
    foo: {
      anyOf: [
        {
          oneOf: [
            {
              allOf: [{ type: "string" }],
            },
            { not: { type: "number" } },
          ],
        },
        { type: "number" },
      ],
    },
  },
};
const validate = ajv.compile(schema);
const data = { foo: "bar" };
if (!validate(data)) {
  const tree1 = structureAJVErrorArray(validate.errors);
  const tree2 = summarizeAJVErrorTree(tree1);
  console.log(stringify(tree2));
  // message: /properties/foo/anyOf >> /foo must match a schema in anyOf
  // children:
  //   - /properties/foo/anyOf/0/oneOf >> /foo must match exactly one schema in oneOf
  //   - /properties/foo/anyOf/1/type >> /foo must be number
}
