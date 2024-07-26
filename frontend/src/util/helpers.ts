type Assert = (condition: unknown, errorMessage?: string) => asserts condition;

export const assert: Assert = (condition, errorMessage) => {
    if (!condition) {
        console.debug("assertion condition:", condition);
        if (errorMessage) {
            throw new Error(`assertion failed: ${errorMessage}`);
        } else {
            throw new Error("assertion failed!");
        }
    }
};

/**
 * Represents an optional field in the examples given to
 * createTypecheckerFromExample. T must not be an object.
 */
export class OptionalField<T> {
    exampleValue: T;
    constructor(exampleValueIfNotNull: T) {
        this.exampleValue = exampleValueIfNotNull;
    }
}

type ExceptOptionals<T extends NonNullable<object>> = {
    [Prop in keyof T]: (T[Prop] extends OptionalField<infer F>
        ? ((F extends NonNullable<object> ? ExceptOptionals<F> : F) | undefined)
        : (T[Prop] extends NonNullable<object> ? ExceptOptionals<T[Prop]> : T[Prop]))
};

export function createArrayTypechecker<T>(checker: (value: unknown) => T, arrayName: string) {
    return (value: unknown) => {
        assert(Array.isArray(value), `expected ${arrayName} to be an array`);
        return value.map((innerValue: unknown) => checker(innerValue));
    };
}

export function createArrayTypecheckerFromExample<T extends NonNullable<object>>(example: T, arrayName: string) {
    const elementChecker = createTypechekerFromExample(example, `${arrayName}[*]`);
    return createArrayTypechecker(elementChecker, arrayName);
}

export function createTypechekerFromExample<T extends NonNullable<object>>(example: T, typeName: string) {
    for (const [key, value] of Object.entries(example)) {
        assert(value != null, `expected ${typeName}.${key} to not be nullish`);
    }
    const isFlatObject = Object.values(example).every((field) => typeof field !== "object");
    if (isFlatObject) {
        return createTypecheckerFromFlatExample(example, typeName);
    } else {
        const nestedCheckers = Object.keys(example)
            .map((keyString) => {
                const key = keyString as keyof typeof example;
                const exampleValue = example[key];
                if (exampleValue != null && typeof exampleValue === "object" && !(exampleValue instanceof OptionalField)) {
                    return {
                        key,
                        checker: createTypechekerFromExample(exampleValue, `${typeName}.${keyString}`),
                    };
                }
            })
            .filter((checker) => checker != undefined);
        const flatExampleFields: Partial<T> = {};
        for (const keyString of Object.keys(example)) {
            const key = keyString as keyof typeof example;
            flatExampleFields[key] = example[key];
        }
        const flatFieldsChecker = createTypecheckerFromFlatExample(
            flatExampleFields as T, // cheat, assume the non-flat checkers will fill the checked object out
            typeName,
        );
        return (value: unknown) => {
            const input = value as Record<keyof T, unknown>; // is this safe? I hope it is.
            const flatResult: ExceptOptionals<T> = flatFieldsChecker(value);
            for (const { key, checker } of nestedCheckers) {
                const fieldName = `${typeName}.${key.toString()}`;
                const exampleValue = example[key];
                const isOptionalField = exampleValue instanceof OptionalField;
                if (isOptionalField && (!(key in input) || input[key] == null)) {
                    continue; // optional field not found or null, that's fine
                }

                // Assert existence
                assert(key in input && input[key] != null, `expected ${fieldName} to exist (non-optional field)`);

                // Assert that the field is an object, it must be since the field has a nested checker
                assert(typeof input[key] === "object", `expected ${fieldName} to be an object`);

                flatResult[key] = checker(input[key]) as ExceptOptionals<T>[typeof key]; // another cheat, TODO: analyze harder
            }
            return flatResult;
        };
    }
}

function createTypecheckerFromFlatExample<T extends NonNullable<object>>(example: T, typeName: string) {
    return (value: unknown) => {
        assert(value != null && typeof value === "object", `expected ${typeName} to be an object`);
        const input = value as Record<keyof T, unknown>; // is this safe? I hope it is.
        const result: Partial<T> = {};
        for (const key of Object.keys(example) as (keyof T)[]) {
            const fieldName = `${typeName}.${key.toString()}`;
            const exampleValue = example[key];
            const isOptionalField = exampleValue instanceof OptionalField;
            const expectedType = exampleValue instanceof OptionalField ? typeof exampleValue.exampleValue : typeof exampleValue;
            if (isOptionalField && (!(key in input) || input[key] == null)) {
                continue; // optional field not found or null, that's fine
            }

            // Assert existence
            assert(key in input && input[key] != null, `expected ${fieldName} to exist (non-optional field)`);
            const inputType = typeof input[key];

            // Assert flatness (just a sanity check in case, for example, an OptionalValue had an object inside, against the docs)
            assert(inputType !== "object", `expected ${fieldName} to not be an object in the inner flat object parser`);

            // Assert that the type matches the example value
            assert(inputType === expectedType, `expected ${fieldName} to be '${expectedType}' but it was '${inputType}'`);
            const inputValue = input[key] as typeof exampleValue; // should be asserted by line above

            // Update result
            result[key] = inputValue;
        }
        return result as ExceptOptionals<T>; // by this point, all keys from the example (except optionals) have been filled in
    };
}
