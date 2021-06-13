const Ajv = require("ajv");
const YAML = require("yaml");
const { asTree } = require("treeify");
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
        { const: "qux" },
      ],
    },
  },
};
const validate = ajv.compile(schema);
const data = { foo: "bar" };
if (!validate(data)) {
  const tree1 = structureAJVErrorArray(validate.errors);
  const tree2 = summarizeAJVErrorTree(tree1);
  console.log(asTree(tree2, true));
  // ├─ .: /properties/foo/anyOf >> /foo must match a schema in anyOf
  // └─ +
  //    ├─ 0: /properties/foo/anyOf/0/oneOf >> /foo must match exactly one schema in oneOf
  //    └─ 1: /properties/foo/anyOf/1/type >> /foo must be number
  const tree3 = summarizeAJVErrorTree(tree1, {
    "schema-depth": 2,
    "instance-depth": 2,
  });
  console.log(YAML.stringify(tree3));
  // instance:
  //   path: /foo
  //   data: bar
  // schema:
  //   path: /properties/foo/anyOf
  //   data:
  //     anyOf:
  //       - ... (object)
  //       - ... (object)
  // message: must match a schema in anyOf
  // children:
  //   - instance:
  //       path: /foo
  //       data: bar
  //     schema:
  //       path: /properties/foo/anyOf/0/oneOf
  //       data:
  //         oneOf:
  //           - ... (object)
  //           - ... (object)
  //     params:
  //       passingSchemas:
  //         - 0
  //         - 1
  //     message: must match exactly one schema in oneOf
  //   - instance:
  //       path: /foo
  //       data: bar
  //     schema:
  //       path: /properties/foo/anyOf/1/const
  //       data:
  //         const: qux
  //     params:
  //       allowedValue: qux
  //     message: must be equal to constant
}
