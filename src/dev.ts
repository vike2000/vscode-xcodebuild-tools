// $ (ts-node()(command ts-node --files -e "$(cat "$1")" "${@:2}") && ts-node <(printf %s\\n 'import {shellQuote, QuoteKind, QuoteToggle} from "./src/util"' 'let args = process.argv.slice(1)' $(: 'declare global{let __packages:any}' :) 'global. _ = require("underscore")' 'if((global. XRegExp = require("xregexp")).XRegExp)' '  global. XRegExp = global. XRegExp.XRegExp' 'import "com.dyn-o-saur.bluelephant.js.tk"' 'const $b = global. $b = __packages.com.dyn_o_saur.bluelephant.js.tk' 'let r = shellQuote(QuoteKind.BashSingle, args[args.length-1])' 'console.log("-- xxd default")' 'console.log($b.xxd(r))' 'console.log("-- xxd ANSI")' 'console.log.apply(console, $b.xxd(r, $b.xxd.CONSOLE|$b.xxd.ANSI)) // $b.xxd.HEXASC|' 'console.log("-- xxdf default")' '$b.xxdf(null, r)' |tee /dev/stderr) -- $'\t\\e\s\\`$$"\'')
import {bashEscapeOrSingleQuote as shescuote} from "shescuote"; //cspell:ignore shescuote
let args = process.argv.slice(1)
declare global{let __packages:any}
global. _ = require("underscore")
if((global. XRegExp = require("xregexp")).XRegExp) global. XRegExp = global. XRegExp.XRegExp
import "com.dyn-o-saur.bluelephant.js.tk"
const $b = global. $b = __packages.com.dyn_o_saur.bluelephant.js.tk
let r = shescuote(args[args.length-1])
console.log("-- xxd default")
console.log($b.xxd(r))
console.log("-- xxd ANSI")
console.log.apply(console, $b.xxd(r, $b.xxd.CONSOLE|$b.xxd.ANSI))
console.log("-- xxdf default")
$b.xxdf(null, r)