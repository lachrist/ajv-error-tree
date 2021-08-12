const { strict: Assert } = require("assert");
const { stringify } = require("yaml");
const {
  structureAJVErrorArray,
  summarizeAJVErrorTree,
} = require("../lib/main.js");
const Ajv = require("ajv");

const match = (any1, any2, path) => {
  Assert.equal(typeof any1, typeof any2, `type mismatch at ${path}`);
  if (typeof any1 === "object" && any1 !== null) {
    Assert.notEqual(any2, null, `expected a non-null object at ${path}`);
    if (Array.isArray(any1)) {
      Assert.ok(Array.isArray(any2), `expected an array at ${path}`);
      Assert.equal(
        any1.length,
        any2.length,
        `array length mismatch at ${path}`
      );
      for (let index = 0; index < any1.length; index += 1) {
        match(any1[index], any2[index], `${path}/${index}`);
      }
    } else {
      for (const key of Reflect.ownKeys(any1)) {
        Assert.equal(typeof key, "string", `unexpected symbol key at ${path}`);
        Assert.notEqual(
          Reflect.getOwnPropertyDescriptor(any2, key),
          undefined,
          `missing property ${key} at ${path}`
        );
        match(any1[key], any2[key], `${path}/${key}`);
      }
    }
  } else {
    Assert.ok(
      Object.is(any1, any2),
      `value mismatch ${JSON.stringify(any1)} !== ${JSON.stringify(
        any2
      )} at ${path}`
    );
  }
};

const ajv = new Ajv({ verbose: true });

const test = (schema, data, matcher) => {
  const validate = ajv.compile(schema);
  Assert.equal(validate(data), false);
  // log(validate.errors);
  // log(structureAJVErrorArray(validate.errors));
  // console.log(formatStructuredAJVError(structureAJVErrorArray(validate.errors)));
  const tree = structureAJVErrorArray(validate.errors);
  match(matcher, tree, "#");
  console.log(stringify(summarizeAJVErrorTree(tree)));
  console.log(
    stringify(
      summarizeAJVErrorTree(tree, {
        "schema-depth": 2,
        "instance-depth": 2,
      })
    )
  );
};

test(
  {
    anyOf: [{ type: "string" }, { allOf: [{ type: "boolean" }] }],
  },
  123,
  {
    keyword: "anyOf",
    parent: null,
    children: [
      {
        keyword: "type",
        schema: "string",
        parent: { type: "string" },
        children: [],
      },
      {
        keyword: "type",
        schema: "boolean",
        parent: { allOf: [{ type: "boolean" }] },

        children: [],
      },
    ],
  }
);

test(
  {
    oneOf: [{ type: "number" }, { type: "number" }],
  },
  123,
  {
    keyword: "oneOf",
    children: [],
  }
);

test(
  {
    allOf: [{ type: "string" }, { type: "number" }],
  },
  123,
  {
    keyword: "type",
    schema: "string",
    children: [],
  }
);

test(
  {
    not: { type: "number" },
  },
  123,
  {
    keyword: "not",
    children: [],
  }
);

console.log("DONE");
