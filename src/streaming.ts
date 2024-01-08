/** @fileoverview Core streaming implementation. */

const streamable = Symbol('streamable');

export interface Streamable {
  [streamable]: true;
  readonly literals: readonly string[];
  readonly interpolations: ReadonlyArray<string | Promise<string> | Streamable>;
}

/**
 * Streams content out of order by generating a synthetic shadow root and
 * placing any slow content into the light DOM slots at the end of the root.
 */
export function streamOutOfOrder(
  literals: readonly string[],
  ...interpolations: ReadonlyArray<
    | string
    | Promise<string>
    | Streamable
  >
): Streamable {
  return { literals, interpolations, [streamable]: true };
}

/** Typical in-order streaming. */
export async function* streamInOrder(
  literals: readonly string[],
  ...interpolations: ReadonlyArray<
    | string
    | Promise<string>
    | Streamable
  >
): AsyncGenerator<string, void, void> {
  const chunks = interleave(literals, interpolations);

  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      yield chunk;
    } else if (chunk instanceof Promise) {
      yield await chunk;
    } else {
      yield* renderOutOfOrder(chunk);
    }
  }
}

async function* renderOutOfOrder({ literals, interpolations }: Streamable):
    AsyncGenerator<string, void, void> {
  const chunks = interleave(literals, interpolations);
  let slotIndex = 0;

  yield '<div>';
  yield '<template shadowrootmode="open">';

  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      yield chunk;
    } else if (chunk instanceof Promise) {
      // Instead of awaiting the `Promise`, replace it with a synthetic slot.
      yield `<slot name="slot_${slotIndex}"></slot>`;
      slotIndex++;
    } else {
      yield* renderOutOfOrder(chunk);
    }
  }

  yield '</template>';

  // Replace each slot in the order the `Promise` values are actually resolved.
  const asyncChunks = chunks
    .filter((chunk): chunk is Promise<string> => chunk instanceof Promise);
  const indexedAsyncChunks = asyncChunks
    .map((promise, index) => promise.then((result) => [
      result,
      index,
    ] as const));
  for await (const [ chunk, index ] of inResolvedOrder(indexedAsyncChunks)) {
    yield `<div slot="slot_${index}">${chunk}</div>`;
  }

  yield '</div>';
}

function interleave<T>(
  literals: readonly string[],
  interpolations: readonly T[],
): Array<string | T> {
  if (literals.length !== interpolations.length + 1) {
    throw new Error('Expected one more literal than an interpolation.');
  }

  const zipped = zip(literals.slice(0, -1), interpolations);
  return zipped.flatMap(([ f, s ]) => [ f, s ]).concat(literals.at(-1)!);
}

function isStreamable(value: unknown): value is Streamable {
  return typeof value === 'object' && value !== null
          && streamable in value;
}

function zip<First, Second>(first: readonly First[], second: readonly Second[]):
    Array<[ First, Second ]> {
  return first.map((f, index) => [ f, second[index] ]);
}

async function* inResolvedOrder<T>(promises: readonly Promise<T>[]):
    AsyncGenerator<T, void, void> {
  const indexedPromises = promises
    .map((promise, index) => promise.then((result) => [
      result,
      index,
    ] as const));

  const [ result, index ] = await Promise.race(indexedPromises);
  yield result;

  const remainingPromises = [
    ...promises.slice(0, index),
    ...promises.slice(index + 1),
  ];
  if (remainingPromises.length === 0) return;

  yield* inResolvedOrder(remainingPromises);
}
