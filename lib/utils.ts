// Returns if a value is truthy, even if undefined.
export const isTruthyWithDefault = (value: undefined | boolean, defaultValue = true) => {
    return typeof value === 'undefined' ? defaultValue : !!value;
};
