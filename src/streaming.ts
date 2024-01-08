/** @fileoverview Core streaming implementation. */

export async function* streamOutOfOrder(
  literals: readonly string[],
  ...interpolations: ReadonlyArray<
    | string
    | Promise<string>
    | AsyncGenerator<string, void, void>
  >
): AsyncGenerator<string, void, void> {
  const chunks = interleave(literals, interpolations);

  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      yield chunk;
    } else if (chunk instanceof Promise) {
      yield await chunk;
    } else {
      yield* chunk;
    }
  }
}

export async function* streamInOrder(
  literals: readonly string[],
  ...interpolations: ReadonlyArray<
    | string
    | Promise<string>
    | AsyncGenerator<string, void, void>
  >
): AsyncGenerator<string, void, void> {
  const chunks = interleave(literals, interpolations);

  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      yield chunk;
    } else if (chunk instanceof Promise) {
      yield await chunk;
    } else {
      yield* chunk;
    }
  }
}

function interleave<First, Second>(
  first: readonly First[],
  second: readonly Second[],
): Array<First | Second> {
  if (first.length !== second.length + 1) {
    throw new Error('Expected one more literal than an interpolation.');
  }

  const zipped = zip(first.slice(0, -1), second);
  return zipped.flatMap(([ f, s ]) => [ f, s ]).concat(first.at(-1)!);
}

function zip<First, Second>(first: readonly First[], second: readonly Second[]):
    Array<[ First, Second ]> {
  return first.map((f, index) => [ f, second[index] ]);
}
