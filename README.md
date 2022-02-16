# text-based stack calculator

## Quickstart

You will need typescript and some node modules to start

```
~ npm install
~ tsc cli.ts
~ node cli.js
```

## Basics

### Numbers
Each number you type is pushed to teh stack from left to right
```
> 2 2.5 .5
stack: [2, 2.5, 0.5]
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
