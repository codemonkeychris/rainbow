// Typing for linq.js, ver 3.0.3-Beta4

declare module linqjs {
    interface IEnumerator<T> {
        current(): T;
        moveNext(): boolean;
        dispose(): void;
    }

    interface EnumerableStatic {
        Utils: {
            createLambda(expression: any): (...params: any[]) => any;
            createEnumerable<T>(getEnumerator: () => IEnumerator<T>): Enumerable<T>;
            createEnumerator<T>(initialize: () => void, tryGetNext: () => boolean, dispose: () => void): IEnumerator<T>;
            extendTo(type: any): void;
        };
        choice<T>(...params: T[]): Enumerable<T>;
        cycle<T>(...params: T[]): Enumerable<T>;
        empty<T>(): Enumerable<T>;
        from<T>(): Enumerable<T>;
        from<T>(obj: Enumerable<T>): Enumerable<T>;
        from(obj: string): Enumerable<string>;
        from(obj: number): Enumerable<number>;
        from<T>(obj: { length: number;[x: number]: T; }): Enumerable<T>;
        from<T>(obj: T): Enumerable<T>;
        make<T>(element: T): Enumerable<T>;
        matches<T>(input: string, pattern: RegExp): Enumerable<string>;
        matches<T>(input: string, pattern: string, flags?: string): Enumerable<string>;
        range(start: number, count: number, step?: number): Enumerable<number>;
        rangeDown(start: number, count: number, step?: number): Enumerable<number>;
        rangeTo(start: number, to: number, step?: number): Enumerable<number>;
        repeat<T>(element: T, count?: number): Enumerable<T>;
        repeatWithFinalize<T>(initializer: () => T, finalizer: (element : T) => void ): Enumerable<T>;
        generate<T>(func: () => T, count?: number): Enumerable<T>;
        toInfinity(start?: number, step?: number): Enumerable<number>;
        toNegativeInfinity(start?: number, step?: number): Enumerable<number>;
        unfold(seed: any, func: (value: any) => any): Enumerable<any>; // UNDONE:TS1.4
        defer(enumerableFactory: () => Enumerable<any>): Enumerable<any>; // UNDONE:TS1.4
    }

    interface Enumerable<T> {
        constructor(getEnumerator: () => IEnumerator<T>);
        getEnumerator(): IEnumerator<T>;

        // Extension Methods
        traverseBreadthFirst(func: (element: T) => Enumerable<T>, resultSelector?: (element: T, nestLevel: number) => T): Enumerable<T>;
        traverseDepthFirst(func: (element: T) => Enumerable<T>, resultSelector?: (element: T, nestLevel: number) => T): Enumerable<T>;
        flatten(): Enumerable<T>;
        pairwise(selector: (prev: T, current: T) => T): Enumerable<T>;
        scan(func: (prev: T, current: T) => T): Enumerable<T>;
        scan(seed: T, func: (prev: T, current: T) => T): Enumerable<T>; // UNDONE:TS1.4
        select<S>(selector: (element: T, index?: number) => S): Enumerable<S>;
        // UNDONE:TS1.4
        selectMany<S>(collectionSelector: (element: T, index?: number) => S[], resultSelector?: (outer: any, inner: any) => any): Enumerable<S>;
        selectMany<S>(collectionSelector: (element: T, index?: number) => Enumerable<S>, resultSelector?: (outer: any, inner: any) => any): Enumerable<S>;
        selectMany<S>(collectionSelector: (element: T, index?: number) => { length: number;[x: number]: S; }, resultSelector?: (outer: any, inner: any) => any): Enumerable<S>;
        where(predicate: (element: T, index?: number) => boolean): Enumerable<T>;
        choose(selector: (element: T, index?: number) => T): Enumerable<T>;
        ofType(type: string|any): Enumerable<T>; // UNDONE:TS1.4 type for type
        zip(second: T[], resultSelector: (first: T, second: T, index?: number) => T): Enumerable<T>;
        zip(second: Enumerable<T>, resultSelector: (first: any, second: any, index?: number) => any): Enumerable<T>;
        zip(second: { length: number;[x: number]: T; }, resultSelector: (first: any, second: any, index?: number) => any): Enumerable<T>;
        zip(...params: any[]): Enumerable<T>; // last one is selector
        merge(second: T[], resultSelector: (first: T, second: T, index?: number) => T): Enumerable<T>;
        merge(second: Enumerable<T>, resultSelector: (first: T, second: T, index?: number) => T): Enumerable<T>;
        merge(second: { length: number;[x: number]: T; }, resultSelector: (first: T, second: T, index?: number) => T): Enumerable<T>;
        merge(...params: any[]): Enumerable<T>; // last one is selector

        // UNDONE:TS1.4
        join(inner: Enumerable<T>, outerKeySelector: (outer: any) =>any, innerKeySelector: (inner: any) =>any, resultSelector: (outer: any, inner: any) => any, compareSelector?: (obj: any) => any): Enumerable<T>;
        groupJoin(inner: Enumerable<T>, outerKeySelector: (outer: any) =>any, innerKeySelector: (inner: any) =>any, resultSelector: (outer: any, inner: any) => any, compareSelector?: (obj: any) => any): Enumerable<T>;

        all(predicate: (element: T) => boolean): boolean;
        any(predicate?: (element: T) => boolean): boolean;
        isEmpty(): boolean;
        concat(...sequences: any[]): Enumerable<T>; // UNDONE:TS1.4
        insert(index: number, second: T[]): Enumerable<T>;
        insert(index: number, second: Enumerable<T>): Enumerable<T>;
        insert(index: number, second: { length: number;[x: number]: T; }): Enumerable<T>;
        alternate(alternateValue: T): Enumerable<T>;
        alternate(alternateSequence: T[]): Enumerable<T>;
        alternate(alternateSequence: Enumerable<T>): Enumerable<T>;
        contains(value: T, compareSelector: (element: T) => any): Enumerable<T>;
        defaultIfEmpty(defaultValue?: T): Enumerable<T>;
        distinct(compareSelector?: (element: T) => any): Enumerable<T>;
        distinctUntilChanged(compareSelector: (element: T) => any): Enumerable<T>;
        except(second: any[], compareSelector?: (element: T) => any): Enumerable<T>;
        except(second: { length: number;[x: number]: any; }, compareSelector?: (element: T) => any): Enumerable<T>;
        except(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;
        intersect(second: any[], compareSelector?: (element: T) => any): Enumerable<T>;
        intersect(second: { length: number;[x: number]: any; }, compareSelector?: (element: T) => any): Enumerable<T>;
        intersect(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;
        sequenceEqual(second: any[], compareSelector?: (element: T) => any): Enumerable<T>;
        sequenceEqual(second: { length: number;[x: number]: any; }, compareSelector?: (element: T) => any): Enumerable<T>;
        sequenceEqual(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;
        union(second: any[], compareSelector?: (element: T) => any): Enumerable<T>;
        union(second: { length: number;[x: number]: any; }, compareSelector?: (element: T) => any): Enumerable<T>;
        union(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;
        orderBy<TKey>(keySelector: (element: T) => TKey): OrderedEnumerable<T, TKey>;
        orderByDescending<TKey>(keySelector: (element: T) => TKey): OrderedEnumerable<T, TKey>;
        reverse(): Enumerable<T>;
        shuffle(): Enumerable<T>;
        weightedSample(weightSelector: (element: T) => any): Enumerable<T>;
        groupBy(keySelector: (element: T) => any, elementSelector?: (element: T) => any, resultSelector?: (key: any, element: T) => any, compareSelector?: (element: T) => any): Enumerable<T>;
        partitionBy(keySelector: (element: T) => any, elementSelector?: (element: T) => any, resultSelector?: (key: any, element: T) => any, compareSelector?: (element: T) => any): Enumerable<T>;
        buffer(count: number): Enumerable<T>;
        aggregate(func: (prev: any, current: any) => any): any;
        aggregate(seed: any, func: (prev: any, current: any) => any, resultSelector?: (last: any) => any): any;
        average(selector?: (element: T) => number): number;
        count(predicate?: (element: T, index?: number) => boolean): number;
        max(selector?: (element: T) => number): number;
        min(selector?: (element: T) => number): number;
        maxBy(keySelector: (element: T) => number): any;
        minBy(keySelector: (element: T) => number): any;
        sum(selector?: (element: T) => number): number;
        elementAt(index?: number): T;
        elementAtOrDefault(index?: number, defaultValue?: T): T;
        first(predicate?: (element: T, index?: number) => boolean): T;
        firstOrDefault(predicate?: (element: T, index?: number) => boolean, defaultValue?: any): T;
        last(predicate?: (element: T, index?: number) => boolean): T;
        lastOrDefault(predicate?: (element: T, index?: number) => boolean, defaultValue?: any): T;
        single(predicate?: (element: T, index?: number) => boolean): T;
        singleOrDefault(predicate?: (element: T, index?: number) => boolean, defaultValue?: any): T;
        skip(count: number): Enumerable<T>;
        skipWhile(predicate: (element: T, index?: number) => boolean): Enumerable<T>;
        take(count: number): Enumerable<T>;
        takeWhile(predicate: (element: T, index?: number) => boolean): Enumerable<T>;
        takeExceptLast(count?: number): Enumerable<T>;
        takeFromLast(count: number): Enumerable<T>;
        indexOf(item: T): number;
        indexOf(predicate: (element: T, index?: number) => boolean): number;
        lastIndexOf(item: T): number;
        lastIndexOf(predicate: (element: T, index?: number) => boolean): number;
        asEnumerable<T>(): Enumerable<T>;
        toArray(): T[];
        toLookup<TValue, TKey>(keySelector: (element: T) => TKey, elementSelector?: (element: T) => TValue, compareSelector?: (element: TValue) => any): Lookup<TValue, TKey>;
        toObject(keySelector: (element: T) => any, elementSelector?: (element: T) => any): Object;
        toDictionary<TValue, TKey>(keySelector: (element: T) => TKey, elementSelector?: (element: T) => TValue, compareSelector?: (element: TValue) => any): Dictionary<TValue, TKey>;
        // UNDONE:TS1.4 all toJSONString
        toJSONString(replacer: (key: string, value: any) => any): string;
        toJSONString(replacer: any[]): string;
        toJSONString(replacer: (key: string, value: any) => any, space: any): string;
        toJSONString(replacer: any[], space: any): string;
        toJoinedString(separator?: string, selector?: (element: T, index?: number) => string): string;
        doAction(action: (element: T, index?: number) => void ): Enumerable<T>;
        doAction(action: (element: T, index?: number) => boolean): Enumerable<T>;
        forEach(action: (element: T, index?: number) => void ): void;
        forEach(action: (element: T, index?: number) => boolean): void;
        write(separator?: string, selector?: (element: T) => string): void;
        writeLine(selector?: (element: T) => string): void;
        force(): void;
        letBind(func: (source: Enumerable<T>) => T[]): Enumerable<T>;
        letBind(func: (source: Enumerable<T>) => { length: number;[x: number]: T; }): Enumerable<T>;
        letBind(func: (source: Enumerable<T>) => Enumerable<T>): Enumerable<T>;
        share(): DisposableEnumerable<T>;
        memoize(): DisposableEnumerable<T>;
        catchError(handler: (exception: any) => void ): Enumerable<T>;
        finallyAction(finallyAction: () => void ): Enumerable<T>;
        log(selector?: (element: T) => void ): Enumerable<T>;
        trace(message?: string, selector?: (element: T) => void ): Enumerable<T>;
    }

    interface OrderedEnumerable<TValue, TKey> extends Enumerable<TValue> {
        createOrderedEnumerable(keySelector: (element: TValue) => TKey, descending: boolean): OrderedEnumerable<TValue, TKey>; // UNDONE:TS1.4
        thenBy<TKey2>(keySelector: (element: TValue) => TKey): OrderedEnumerable<TValue, TKey2>;
        thenByDescending<TKey2>(keySelector: (element: TValue) => TKey2): OrderedEnumerable<TValue, TKey2>;
    }

    interface DisposableEnumerable<T> extends Enumerable<T> {
        dispose(): void;
    }

    interface Dictionary<TKey, TValue> {
        add(key: TKey, value: TValue): void;
        get(key: TKey): TValue;
        set(key: TKey, value: TValue): boolean;
        contains(key: TKey): boolean;
        clear(): void;
        remove(key: TKey): void;
        count(): number;
        // UNDONE:TS1.4
        toEnumerable(): Enumerable<[TKey, TValue]>; // Enumerable<KeyValuePair>
    }

    interface Lookup<TKey, TValue> {
        count(): number;
        get(key: TKey): Enumerable<TValue>;
        contains(key: TKey): boolean;
        toEnumerable(): Enumerable<Grouping<TKey, TValue>>; // Enumerable<Groping>
    }

    // UNDONE:TS1.4
    interface Grouping<TKey, TValue> extends Enumerable<TValue> {
        key(): TKey;
    }
}

// export definition
declare var Enumerable: linqjs.EnumerableStatic;