export const monkeypatch = <T, K extends keyof T>(
    obj: T,
    key: K,
    cb: (getOriginal: () => T[K], setOriginal: (value: T[K]) => void) => { get(): T[K]; set(value: T[K]): void }
): (() => void) => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(obj, key as PropertyKey);

    // Create a getter that accesses the original value
    const getOriginal = () => {
        if (originalDescriptor?.get) {
            return originalDescriptor.get.call(obj);
        }
        if (originalDescriptor?.value !== undefined) {
            return originalDescriptor.value;
        }
        return (obj as any)[key];
    };

    // Create a setter that sets the original value
    const setOriginal = (value: T[K]) => {
        if (originalDescriptor?.set) {
            originalDescriptor.set.call(obj, value);
        } else {
            (obj as any)[key] = value;
        }
    };

    // Get the new getter/setter from the callback
    const getset = cb(getOriginal, setOriginal);

    // Define the new property
    Object.defineProperty(obj, key as PropertyKey, getset);

    return () => {
        if (originalDescriptor) {
            Object.defineProperty(obj, key as PropertyKey, originalDescriptor);
        } else {
            delete (obj as any)[key];
        }
    };
};

export const watch = <T, K extends keyof T>(obj: T, key: K, cb: (newValue: T[K], oldValue: T[K]) => void) => {
    return monkeypatch(obj, key, (getOriginal, setOriginal) => {
        return {
            get: getOriginal,
            set(value) {
                cb(value, getOriginal());
                setOriginal(value);
            }
        };
    });
}
