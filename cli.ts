import evaluate, { Status, addMacros, macroses, readable, isNumeric } from "./evaluation";
import type { EvalReturn, MacrosResultError } from "./evaluation";

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')

const logError = (err : string) => console.error(err)

let debug : boolean = false;
// Flags
if (process.argv.some(a => a === '-d' || a ==='--debug')) {
    debug = true
}
process.argv.some((arg, idx) => {
    if (arg === '-m' || arg === '--macros') {
        if (!process.argv[idx + 1]) {
            logError(`flag -m accepts path as argument, but nothing was passed`)
            return true
        }
        const filename = process.argv[idx + 1]       
        if (path.extname(filename) !== '.json') {
            logError(`flag -m only accepts path to json files`)
            return true
        }

        let file : string;
        try {
            file = fs.readFileSync(filename, 'utf-8')
        } catch (err) {
            console.log(`Couldn't get access to file ${filename}: ${err}`)
            return
        }
        
        
        let json = {}
        try {
            json = JSON.parse(file)
        } catch (err) {
            console.log(`Couldn't parse the file: ${err}`)
            return
        }
        
        Object.keys(json).forEach(name => {
            if (typeof json[name] !== 'string') {
                console.log(`Macroses should be strings, but encountered ${JSON.stringify(json[name])}`)
                return
            }
            
            const result = addMacros(name, json[name])
            if (result.status === Status.Ok) console.log(`Added macros: ${name} -> ${json[name]}`)
            else {
                console.log(`Couldn't add macros '${name}'`)
                console.log('    ' + (result as MacrosResultError).message)
            }
        })
        return arg === '-m' || arg === '--macros' 
    }
    return false
})

console.log('Input your equation:')

const getEquation = async () => {
    const input = await inquirer.prompt({
        name: 'equation',
        prefix: '',
        type: 'input',
        message: '> ',
    })
    return input.equation
}

(async () => {
    while (true) {
        const equation = await getEquation()

        if (equation.length === 0) continue
    
        // Commands
        if (equation === ':exit' || equation === ':e') {console.log('exiting...'); break}
        if (equation === ':debug' || equation === ':d') {
            debug = !debug
            console.log(`debug mode: ${debug ? 'ON' : 'OFF'}`)
            continue
        }
        if (equation === ':m' || equation === ':macroses') {
            console.log('Macroses:')
            Object.keys(macroses).forEach(name => {
                console.log(`  ${name} -> ${macroses[name].map(readable).join(' ')}`)
            })
            continue
        }
        
        if (equation.length > 0 && equation[0] === '!') {
            const splitted = equation.slice(1).split(/\s+/).filter(a => a)
            
            // Macros errors
            if (!splitted[0]) logError('ERROR:\nmacros definition should start with a name')
            if (splitted[0][0] === '!') logError(`ERROR:\nmacros name can't start with a '!'`)
            if (splitted[0][0] === ':') logError(`ERROR:\nmacros name can't start with a ':'`)
            if (isNumeric(splitted[0])) logError(`ERROR:\nmacros name can't be a number`)
            
            const macrosResult = addMacros(splitted[0], splitted.slice(1).join(' '))
            if (macrosResult.status === Status.Error) {
                logError(`ERROR:\n${(macrosResult as MacrosResultError).message}`)
            }
            continue
        }
        let result : EvalReturn = evaluate(equation, debug)
        if (result.status === Status.Ok)
            console.log(result.stack)
        else
            logError(`ERROR:\n${result.message}`)
    }
})()