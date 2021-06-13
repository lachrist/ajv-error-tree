const { strict: Assert } = require("assert");

exports.structureAJVErrorArray = (errors) => {
  let index = errors.length;
  const visit = (parent) => {
    index -= 1;
    Assert.ok(index >= 0, "something went wrong");
    const error = {
      ...errors[index],
      parent,
      children: null,
    };
    Assert.notEqual(
      Reflect.getOwnPropertyDescriptor(error, "schema"),
      undefined,
      "missing schema field, this is probably because the verbose options was not set to true -- new Ajv({verbose:true})"
    );
    Assert.notEqual(
      error.keyword,
      "allOf",
      "unexpected allOf schema combinator"
    );
    if (error.keyword === "anyOf") {
      error.children = error.schema.slice().reverse().map(visit).reverse();
    } else if (error.keyword === "oneOf") {
      error.children = error.schema
        .slice()
        .reverse()
        .filter((_, index) => !error.params.passingSchemas.includes(index))
        .map(visit)
        .reverse();
    } else {
      error.children = [];
    }
    return error;
  };
  return visit(null);
};

const strip = (any, depth) => {
  if (typeof any === "object" && any !== null) {
    if (depth === 0) {
      return Array.isArray(any) ? "... (array)" : "... (object)";
    }
    if (Array.isArray(any)) {
      return any.map((any) => strip(any, depth - 1));
    }
    let copy = { __proto__: null };
    for (let key of Reflect.ownKeys(any)) {
      copy[key] = strip(any[key], depth - 1);
    }
    return { ...copy };
  }
  return any;
};

exports.summarizeAJVErrorTree = (tree, options) => {
  options = {
    "schema-depth": 0,
    "instance-depth": 0,
    ...options,
  };
  if (options["schema-depth"] === 0 && options["instance-depth"] === 0) {
    const visit = (error) => {
      const message = `${error.schemaPath.substring(1, Infinity)} >> ${
        error.instancePath === "" ? "/" : error.instancePath
      } ${error.message}`;
      if (error.children.length === 0) {
        return message;
      }
      return {
        ".": message,
        "+": error.children.map(visit),
      };
    };
    return visit(tree);
  }
  const visit = (error) => ({
    instance: {
      path: error.instancePath,
      data: strip(error.data, options["data-depth"]),
    },
    schema: {
      path: error.schemaPath.substring(1, Infinity),
      data: strip(error.parentSchema, options["schema-depth"]),
    },
    message: error.message,
    ...(error.children.length === 0
      ? {}
      : {
          children: error.children.map(visit),
        }),
  });
  return visit(tree);
};
