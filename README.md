# text-based stack calculator

## Quickstart

You can install this package and run it with npx

```
~ npm i -g stack-calc
~ npx stack-calc
```

## Basics

### Numbers
Each number you type is pushed to the stack from left to right
```
> 2 2.5 -.5
stack: [2, 2.5, -0.5]
```

### Operations and functions
Operations, Functions etc. take arguments by popping numbers from the stack
> Plus '+' will pop two numbers and push their sum
```
> 2 2 +
stack: [4]
```

### Intrinsics
There are also `intrinsics` which don't represent any mathematical operations, but just affect the stack
```
> 2 dup
stack: [2, 2]
```

### Macros
Macros are a set of statements combined in one word.
You can define a `macro` by starting your command with `!` symbol.
```
> !PI 3.1415
> !log2 2 swap log
```
After that these macros will be saved and you will be able to use them
```
> 8 log2
stack: [3]
```
`log2` will expand to `2 swap log` and as the result the "equation" will look like this:
`8 2 swap log`

You can preload your macros in json file with `-m` or `--macro` flag
`node cli.js --macro macrostest.json`

### Additional commands

These are commands which you can type instead of equations

`:d` or `:debug` - switches debug mode

`:m` or `:macros` - prints out all defined macros

```
> :macros
Macros:
    PI -> 3.1415
    log2 -> 2 swap log
```

## List of everythin

### Operators


> **+** - sums two numbers `2 2 +` -> `4`

> **-** - stubtracts numbers `3 2 -` -> `1`

> **\*** - multiplies numbers `3 2 *` -> `6`

> **/** - devides numbers `3 2 /` -> `1.5`

> **//** - devides numbers and floors the result `3 2 //` -> `1`

> **%** - modulus of numbers `3 2 %` -> `1`

### Intrinsics


> **dup** - duplicates the last number on the stack `2 dup` -> `2 2`

> **drop** - drops the last number on the stack `2 2 drop` -> `2`

> **swap** - swaps last two numbers on the stack `1 2 swap` -> `2 1`

> **over** - duplicates the number before the last one `2 1 over` -> `2 1 2`

### Functions

> **sqrt** - square root `4 sqrt` -> `2`

> **sin** - sinus `3.1415 2 / sin` -> `0.999...`

> **cos** - cosinus `3.1415 cos` -> `-0.999...`

> **tan** - tangens `3.1415 4 / tan` -> `0.999...`

> **ctan** - cotangens `3.1415 4 / ctan` -> `1.000...`

> **asin** - arcsin `1 asin 2 *` -> `3.1415...`

> **acos** - arccos `1 acos` -> `0`

> **atan** - arctan `1 atan` -> `0`

> **log** - logarithm `2 8 log` -> `3`

> **ln** - natural logarithm `2.7 ln` -> `0.9932...`

> **fact** - factorial `5 fact` -> `120`

> **pow** - power `2 4 pow` -> `16`

> **root** - root `8 3 root` -> `2`
