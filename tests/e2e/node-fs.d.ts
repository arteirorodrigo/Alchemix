// O projeto não usa @types/node; os testes e2e só precisam disto.
declare module 'node:fs' {
  export function readFileSync(path: URL | string, encoding: 'utf8'): string
}
