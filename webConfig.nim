import os, strutils

proc envOrDefault(key, fallback: string): string = 
    result = getEnv(key)
    if not existsEnv(key):
        result = fallback

let PORT*: int = envOrDefault("PORT", "33333").parseInt
let THEME*: string = envOrDefault("THEME", "DRYAD")
let DB_FILE*: string = envOrDefault("DB_FILE", "wateringCan.sqlite")
let BIND_LOCAL_ONLY*: bool = envOrDefault("BIND_LOCAL_ONLY", "true").toLowerAscii().parseBool()