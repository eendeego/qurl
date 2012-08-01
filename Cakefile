# This is the same Cakefile as in
# https://github.com/sstephenson/node-coffee-project

util          = require 'util'
fs            = require 'fs'
{spawn, exec} = require 'child_process'

copy_module_assets = (service, callback) ->
  exec([
    "mkdir -p public/stylesheets/s/#{service}"
    "cp src/services/#{service}/public/stylesheets/style.css public/stylesheets/s/#{service}/style.css"
    "mkdir -p views/s/#{service}"
    "cp src/services/#{service}/views/* views/s/#{service}/"
  ].join(' && '), (err, stdout, stderr) ->
    if err then console.log stderr else console.log "Assets for #{service} copied."
    callback?()
  )


build = (watch, callback) ->
  if typeof watch is 'function'
    callback = watch
    watch = false

  options = ['-c', '-o']
  options.unshift '-w' if watch

  fs.readdir 'src', (err, contents) ->
    files = [['lib'].concat("src/#{src}" for src in contents when !/^services/.test(src))]

    fs.readdir 'src/services', (err, contents) ->
      copy_module_assets(service) for service in contents

      files = files.concat(["lib/services/#{file}", "src/services/#{file}/src"] for file in contents)
      files = files.concat(["public/javascripts/s/#{file}", '-b', "src/services/#{file}/public/coffeescripts"] for file in contents)

      coffees = files.length

      for pair in files
        coffee = spawn 'coffee', options.concat(pair)
        coffee.stdout.on 'data', (data) -> console.log data.toString()
        coffee.stderr.on 'data', (data) -> console.log data.toString()
        coffee.on 'exit', (status) -> callback?() if (--coffees is 0)

task 'docs', 'Generate annotated source code with Docco', ->
  fs.readdir 'src', (err, contents) ->
    files = ("src/#{file}" for file in contents when /\.coffee$/.test file)
    docco = spawn 'docco', files
    docco.stdout.on 'data', (data) -> console.log data.toString()
    docco.stderr.on 'data', (data) -> console.log data.toString()
    docco.on 'exit', (status) -> callback?() if status is 0

task 'build', 'Compile CoffeeScript source files', ->
  build()

task 'watch', 'Recompile CoffeeScript source files when modified', ->
  build true

# task 'test', 'Run the test suite', ->
#   build ->
#     require.paths.unshift __dirname + "/lib"
#     {reporters} = require 'nodeunit'
#     process.chdir __dirname
#     reporters.default.run ['test']
