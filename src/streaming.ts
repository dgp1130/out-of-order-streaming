/** @fileoverview Core streaming implementation. */

export function streamOutOfOrder(
  literals: readonly string[],
  ...interpolations: ReadonlyArray<Promise<string> | string>
): ReadableStream {
  const chunks = interleave(literals, interpolations);
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller): Promise<void> {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(await chunk));
      }

      controller.close();
    },
  });
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
