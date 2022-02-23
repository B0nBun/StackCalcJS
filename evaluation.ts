#!/usr/bin/env node
enum Type {
    Number,
    Operator,
    Intrinsic,
    Function,
    Macro
}

enum Operator {
    Plus,
    Minus,
    Mul,
    Div,
    FloorDiv,
    Mod
}

enum Intrinsic {
    Dup,
    Over,
    Drop,
    Swap
}

enum MFunction {
    Sqrt, Sin , Cos ,
    Tan , Ctan, Asin,
    Acos, Atan, Log ,
    Ln  , Fact, Pow ,
    Root
}

interface Statement {
    type: Type,
    value: MFunction | Intrinsic | number | Operator,
    from: number
}

export enum Status {Error, Ok}

interface IResultOk {
    status: Status.Ok,
    value: number[]
}

interface IResultError {
    status: Status.Error,
    value: string
}
type Result = IResultError | IResultOk

const unreachable = () => {throw new Error('Unreachable')}
const OkResult = (res : number[]) : IResultOk => ({status: Status.Ok, value: res}) 
const ErrorResult = (message: string) : IResultError => ({status: Status.Error, value: message})

const factorial = (n : number) : number => {
    let acc = 1
    let isNeg = n < 0
    n = Math.abs(n)
    while (--n >= 1) acc *= (n + 1)
    return acc * (isNeg ? -1 : 1)
}

const root = (n : number, r : number) : number => {
    if (n < 0 && r % 2 !== 0 && Math.floor(r) === r)
        return -Math.pow(-n, 1 / r)
    return Math.pow(n, 1 / r)
}

export const isNumeric = (n : string) : boolean => n && Boolean(n.match(/^\-?\d*\.?\d+$/))

const isOperator = (n : string) : boolean => Boolean(/^[\+|\-|\*|\/|\/\/|\%]$/.exec(n))
const whichOperator = (n : string) : Operator =>
    n === '+'    ? Operator.Plus     :
    n === '-'    ? Operator.Minus    :
    n === '\/'   ? Operator.Div      :
    n === '*'    ? Operator.Mul      :
    n === '\/\/' ? Operator.FloorDiv :
    n === '%'    ? Operator.Mod      :
    unreachable()

const isIntrinsic = (n : string) : boolean => ['drop', 'over', 'dup', 'swap'].some(i => i === n)
const whichIntrinsic = (n : string) : Intrinsic => 
    n === 'drop' ? Intrinsic.Drop :
    n === 'over' ? Intrinsic.Over :
    n === 'dup'  ? Intrinsic.Dup  :
    n === 'swap' ? Intrinsic.Swap :
    unreachable()

const isFunction = (n : string) : boolean =>
    ['sqrt', 'sin', 'cos', 'tan', 'ctan', 'asin', 'acos', 'atan', 'log', 'ln', 'fact', 'pow', 'root']
    .some(i => i === n)
const whichFunction = (n : string) : MFunction =>
    n === 'sqrt' ? MFunction.Sqrt :
    n === 'sin'  ? MFunction.Sin  :
    n === 'cos'  ? MFunction.Cos  :
    n === 'tan'  ? MFunction.Tan  :
    n === 'ctan' ? MFunction.Ctan :
    n === 'asin' ? MFunction.Asin :
    n === 'acos' ? MFunction.Acos :
    n === 'atan' ? MFunction.Atan :
    n === 'log'  ? MFunction.Log  :
    n === 'ln'   ? MFunction.Ln   :
    n === 'fact' ? MFunction.Fact :
    n === 'pow'  ? MFunction.Pow  :
    n === 'root' ? MFunction.Root :
    unreachable()

let reserved = [
    'sqrt', 'sin', 'cos', 'tan', 'ctan', 'asin', 'acos',
    'atan', 'log', 'ln', 'fact', 'pow', 'root', 'drop',
    'over', 'dup', 'swap', '+', '-', '*', '%', '//', '/'
]

export const readable = (statement : Statement) : string => {
    switch(statement.type) {
        case Type.Number: return statement.value.toString()
        case Type.Operator:
            switch(statement.value) {
                case Operator.Plus     : return '+'
                case Operator.Minus    : return '-'
                case Operator.Div      : return '/'
                case Operator.FloorDiv : return '//'
                case Operator.Mod      : return '%'
                case Operator.Mul      : return '*'
            }
        case Type.Function:
            switch (statement.value) {
                case MFunction.Sqrt: return "sqrt"
                case MFunction.Sin : return "sin" 
                case MFunction.Cos : return "cos" 
                case MFunction.Tan : return "tan" 
                case MFunction.Ctan: return "ctan"
                case MFunction.Asin: return "asin"
                case MFunction.Acos: return "acos"
                case MFunction.Atan: return "atan"
                case MFunction.Log : return "log" 
                case MFunction.Ln  : return "ln"  
                case MFunction.Fact: return "fact"
                case MFunction.Pow : return "pow" 
                case MFunction.Root: return "root"
            }
        case Type.Intrinsic:
            switch (statement.value) {
                case Intrinsic.Drop: return "drop"
                case Intrinsic.Over: return "over"
                case Intrinsic.Dup : return "dup"
                case Intrinsic.Swap: return "swap"
            }
            
    }
}

type Macro = {[key : string] : Statement[]}
export interface MacroResultOk {
    status: Status
}
export interface MacroResultError {
    status: Status,
    message: string
}

export const macros : Macro = {}
const isMacro = (n : string) : boolean => Object.keys(macros).some(m => m === n)
export const addMacro = (name : string, eq : string) : MacroResultError | MacroResultOk => {
    if (reserved.some(r => r === name)) {
        return {status: Status.Error, message: `${name} is already reserved`}
    }
    const parseResult = parse(eq)
    if (parseResult.status === Status.Ok) {
        macros[name] = parseResult.statements
        return {status: Status.Ok}
    }
    return {
        status: Status.Error,
        message: parseResult.message
    }
}

const resultWrapper = (
    stack : number[],
    checks : ((s : number[]) => [boolean, string])[], // Checks
    callback : (s : number[]) => number[] // Callback that is called if check is passed
) : Result => {
    const pairs = checks.map(check => check([...stack])).filter(pair => !pair[0])
    //  if pairs are empty, then there's no errors
    if (pairs.length == 0) return OkResult(callback([...stack]))
    else return ErrorResult(pairs[0][1])
}

// Functions that return common checks 
type Check = (s : number[]) => [boolean, string]

const isEnoughCheck = (n : number) : Check => s =>
    [s.length >= n, `Expected at least ${n} items on the stack`]
const isLastGreaterCheck = (n : number) : Check => s =>
    [s[s.length - 1] >= n, `Expected number that is greater or equal ${n}`]
const isLastLesserCheck = (n : number) : Check => s =>
    [s[s.length - 1] <= n, `Expected number that is lesser or equal ${n}`]

const operationResult = (stack : number[], operator : Operator) : Result => {
    let copy = [...stack]
    switch(operator) {
        case Operator.Plus:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    stack.push(stack.pop() + stack.pop())
                    return stack
                }
            )
        case Operator.Minus:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    let tmp = stack.pop()
                    stack.push(stack.pop() - tmp)
                    return stack
                }    
            )
        case Operator.Div:
            return resultWrapper(copy,
                [
                    isEnoughCheck(2),
                    stack => [stack[stack.length - 1] !== 0, 'division by zero']
                ],
                stack => {
                    let tmp = stack.pop()
                    stack.push(stack.pop() / tmp)
                    return stack
                }
            )
        case Operator.Mul:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    stack.push(stack.pop() * stack.pop())
                    return stack
                }
            )
        case Operator.FloorDiv:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    let tmp = stack.pop()
                    stack.push(Math.floor(stack.pop() / tmp))
                    return stack
                }
            )
        case Operator.Mod:
            return resultWrapper(copy,
                [
                    isEnoughCheck(2),
                    stack => [stack[stack.length - 1] !== 0, 'modulo by zero']
                ],
                stack => {
                    let tmp = stack.pop()
                    stack.push(stack.pop() % tmp)
                    return stack
                }    
            )
        default:
            unreachable()
    }
}

const intrinsicResult = (stack : number[], intrinsic : Intrinsic) : Result => {
    let copy = [...stack]
    switch (intrinsic) {
        case Intrinsic.Dup:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.push(stack[stack.length - 1])
                    return stack
                }
            )
        case Intrinsic.Drop:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.pop()
                    return stack
                }    
            )
        case Intrinsic.Over:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    stack.push(stack[stack.length - 2])
                    return stack
                }
            )
        case Intrinsic.Swap:
            return resultWrapper(copy,
                [isEnoughCheck(2)],
                stack => {
                    let [tmp1, tmp2] = [stack.pop(), stack.pop()]
                    stack = [...stack, tmp1, tmp2]
                    return stack
                }
            )
        default:
            unreachable()
    }
}

const functionResult = (stack : number[], func : MFunction) : Result => {
    let copy = [...stack]
    switch (func) {
        case MFunction.Sqrt:
            return resultWrapper(copy,
                [
                    isEnoughCheck(1),
                    isLastGreaterCheck(0)
                ],
                stack => {
                    stack.push(Math.sqrt(stack.pop()))
                    return stack
                }
            )
        case MFunction.Sin:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.push(Math.sin(stack.pop()))
                    return stack
                }
            )
        case MFunction.Cos:
            return resultWrapper(copy,
                [isEnoughCheck(1),],
                stack => {
                    stack.push(Math.cos(stack.pop()))
                    return stack
                }
            )
        case MFunction.Tan:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.push(Math.tan(stack.pop()))
                    return stack
                }
            )
        case MFunction.Asin:
            return resultWrapper(copy,
                [
                    isEnoughCheck(1),
                    isLastLesserCheck(1),
                    isLastGreaterCheck(-1)
                ],
                stack => {
                    stack.push(Math.asin(stack.pop()))
                    return stack
                }    
            )
        case MFunction.Acos:
            return resultWrapper(copy,
                [
                    isEnoughCheck(1),
                    isLastLesserCheck(1),
                    isLastGreaterCheck(-1)
                ],
                stack => {
                    stack.push(Math.acos(stack.pop()))
                    return stack
                }
            )
        case MFunction.Atan:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.push(Math.acos(stack.pop()))
                    return stack
                }
            )
        case MFunction.Ctan:
            return resultWrapper(copy,
                [isEnoughCheck(1)],
                stack => {
                    stack.push(1 / Math.tan(stack.pop()))
                    return stack
                }
            )
        case MFunction.Log:
            return resultWrapper(copy,
                [
                    isEnoughCheck(2),
                    stack => [
                        stack[stack.length - 2] > 0 && stack[stack.length - 2] != 1,
                        'log base should be greater than 0 and not equal to 1'
                    ],
                    stack => [
                        stack[stack.length - 1] > 0,
                        'number from which you take log should be greater than 0'
                    ]
                ],
                stack => {
                    stack.push(Math.log(stack.pop()) / Math.log(stack.pop()))
                    return stack
                }
            )
        case MFunction.Ln:
            return resultWrapper(copy,
                [
                    isEnoughCheck(1),
                    stack => [
                        stack[stack.length - 1] > 0,
                        'number from which you take log should be greater than 0'
                    ]
                ],
                stack => {
                    stack.push(Math.log(stack.pop()))
                    return stack
                }
            )
        case MFunction.Fact:
            return resultWrapper(copy,
                [
                    isEnoughCheck(1),
                    stack => [
                        Math.floor(stack[stack.length - 1]) === stack[stack.length - 1],
                        'factorial can only accept integers'
                    ]
                ],
                stack => {
                    stack.push(factorial(stack.pop()))
                    return stack
                }
            )
        case MFunction.Pow:
            return resultWrapper(copy,
                [
                    isEnoughCheck(2),
                    stack => {
                        let power = stack.pop()
                        let base = stack.pop()
                        let isOk = true
                        if (Math.floor(power) !== power && base < 0) isOk = false
                        return [isOk, 'negative numbers can have only integer powers']
                    }
                ],
                stack => {
                    let tmp = stack.pop()
                    stack.push(Math.pow(stack.pop(), tmp))
                    return stack
                }
            )
        case MFunction.Root:
            return resultWrapper(copy,
                [
                    isEnoughCheck(2),
                    stack => {
                        let rpower = stack.pop()
                        let power = 1 / rpower
                        let base = stack.pop()
                        let isOk = true
                        if (Math.floor(power) !== power && base < 0) isOk = false
                        if (base < 0 && rpower % 2 !== 0 && Math.floor(rpower) === rpower) isOk = true
                        return [isOk, "even and not integer roots of negative numbers are undefined"]
                    }
                ],
                stack => {
                    let tmp = stack.pop()
                    stack.push(root(stack.pop(), tmp))
                    return stack
                }    
            )
        default:
            unreachable()
    }
}

const checkForBrackets = (eq : string) => {
    let count = 0
    let correct = true
    eq.replace(/\(|\)/g, (match) => {
        if (!correct) return ''
        
        if (match === '(') count ++
        else count --
        
        if (count < 0) correct = false
        return ''
    })
    if (count > 0 || !correct) return false
    return true
}

const clearAllBrackets = (s : string) => s.replace(/\(|\)/g, '')

interface ParseOk {
    status: Status.Ok,
    statements : Statement[]
}

interface ParseError {
    status: Status.Error,
    message: string
}

function parse(eq : string, debug : boolean = false) : ParseOk | ParseError {
    if (!checkForBrackets(eq)) {
        return {
            status: Status.Error,
            message: 'bracket placement is invalid'
        }
    }
    eq = clearAllBrackets(eq)
    
    const splitted = eq.split(/\s+/).filter(e => e)
    if (debug) console.log(`splitted to ${JSON.stringify(splitted)}`)
    const parsed : Statement[] = []
    let errorMessage : string = ''
    let isBreak : boolean = false
    
    splitted.forEach((e:string, idx : number) => {
        // for debugging purposes, basically acts like a comment
        if (e === ';') isBreak = true
        if (isBreak || errorMessage) return
        
        if (isMacro(e)) {
            if (debug) console.log(`Macro ${e}`)
            macros[e].forEach((s : Statement) => {
                s = {
                    ...s,
                    from: idx // we replace index generated on `addMacro` step with current
                }
                parsed.push(s)
                if (debug) console.log(`  parsed ${JSON.stringify(s)} - ${readable(s)}`)
            })
            return
        }
        let statement = (
            isNumeric(e)   ? {type: Type.Number, value: Number(e), from: idx} as Statement            :
            isOperator(e)  ? {type: Type.Operator, value: whichOperator(e), from: idx} as Statement   :
            isIntrinsic(e) ? {type: Type.Intrinsic, value: whichIntrinsic(e), from: idx} as Statement :
            isFunction(e)  ? {type: Type.Function, value: whichFunction(e), from: idx} as Statement   :
            null
        )
        if (!statement) errorMessage = `'${e}' is undefined`
        if (debug) console.log(`parsed ${JSON.stringify(statement)} - ${readable(statement)}`)
        parsed.push(statement)
    })
    if (errorMessage) {
        return {
            status: Status.Error,
            message: errorMessage
        }
    }
    return {
        status: Status.Ok,
        statements: parsed
    }
}

const placeByWordIdx = (s : string, wordidx : number) : number => {
    let count = 0
    let found = -1
    s.replace(/\S+/g, (_, idx) => {
        if (count ++ === wordidx) found = idx
        return ''
    })
    return found
}

const repeat = (s : string, c : number) : string => {
    let res = ''
    for (let i = 0; i < c; i ++) res += s
    return res
}

interface EvaluationOk {
    status : Status.Ok,
    stack  : number[]
}

export interface EvaluationError {
    status  : Status.Error,
    message : string
}

export type EvalReturn = EvaluationOk | EvaluationError
export default function evaluate(original : string, debug : boolean = false) : EvalReturn {    
    if (debug) console.log(`parsing`)
    const parseResult = parse(original, debug)
    let stack = []
    let result : Result;
    let errorMessage = ''

    if (parseResult.status === Status.Error) {
        return {
            status: Status.Error,
            message: parseResult.message
        }
    }
    const eq = parseResult.statements


    const handleError = (message : string, wordidx : number) => {
        let place = placeByWordIdx(original, wordidx)
        errorMessage = (`${original}
${repeat(' ', place)}^ ${message}
stack: [${stack.join(', ')}]`)
    }

    eq.forEach((statement) => {
        switch(statement.type) {
            case Type.Number:
                stack.push(statement.value as number)
                break
            case Type.Operator:
                result = operationResult(stack, statement.value as Operator)
                if (result.status === Status.Ok) stack = result.value
                else handleError(result.value, statement.from)
                break
            case Type.Intrinsic:
                result = intrinsicResult(stack, statement.value as Intrinsic)
                if (result.status === Status.Ok) stack = result.value
                else handleError(result.value, statement.from)
                break
            case Type.Function:
                result = functionResult(stack, statement.value as MFunction)
                if (result.status === Status.Ok) stack = result.value
                else handleError(result.value, statement.from)
                break
            default:
                unreachable()
        }
        if (debug) console.log(`encountered: ${readable(statement)} -> current stack : ${JSON.stringify(stack)}`)
        return
    })
    if (errorMessage.length !== 0) {
        return {
            status  : Status.Error,
            message : errorMessage
        }
    } else {
        return {
            status : Status.Ok,
            stack  : stack
        }
    }
}


// Special symbols
// ; - something like a comment, basically stops the execution and spits out current stack
// () - decorative brackets that are ignored, but still checked for correctness
//? TODO: Think about adding comments that can close  e.g. /* comment */