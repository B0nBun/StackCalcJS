#!/usr/bin/env node
import evaluate, { Status, addMacro, macros, readable, isNumeric } from "./evaluation";
import type { EvalReturn, MacroResultError } from "./evaluation";

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
    if (arg === '-m' || arg === '--macro') {
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
                console.log(`Macros should be strings, but encountered ${JSON.stringify(json[name])}`)
                return
            }
            
            const result = addMacro(name, json[name])
            if (result.status === Status.Ok) console.log(`Added macro: ${name} -> ${json[name]}`)
            else {
                console.log(`Couldn't add macro '${name}'`)
                console.log('    ' + (result as MacroResultError).message)
            }
        })
        return arg === '-m' || arg === '--macro' 
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
        if (equation === ':m' || equation === ':macros') {
            console.log('Macros:')
            Object.keys(macros).forEach(name => {
                console.log(`  ${name} -> ${macros[name].map(readable).join(' ')}`)
            })
            continue
        }
        
        if (equation.length > 0 && equation[0] === '!') {
            const splitted = equation.slice(1).split(/\s+/).filter(a => a)
            
            // Macros errors
            if (!splitted[0]) logError('ERROR:\nmacro definition should start with a name')
            if (splitted[0][0] === '!') logError(`ERROR:\nmacro name can't start with a '!'`)
            if (splitted[0][0] === ':') logError(`ERROR:\nmacro name can't start with a ':'`)
            if (isNumeric(splitted[0])) logError(`ERROR:\nmacro name can't be a number`)
            
            const macroResult = addMacro(splitted[0], splitted.slice(1).join(' '))
            if (macroResult.status === Status.Error) {
                logError(`ERROR:\n${(macroResult as MacroResultError).message}`)
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