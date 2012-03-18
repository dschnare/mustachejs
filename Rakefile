#!/usr/bin/ruby
#coding: utf-8

##########
# CONFIG #
##########

ENCODING = Encoding::UTF_8
JS_IN_DIR = 'src'
JS_OUT_DIR = File.join('web', 'public', 'inc', 'scripts') # web/inc/scripts
JS_MODULE_TEMPLATE_GLOB = File.join(JS_IN_DIR, '**', '_*.js')

HEADER_BASENAME = File.join('headers', 'Header')
# Define a module to get the header file. We define
# a getter so that way the header is only ever loaded
# when its needed and it's only loaded once.
module Header
	@@cache = {}

	def Header.get(ext)
		if @@cache.key?(ext) then return @@cache[ext] end
		headerFile = "#{HEADER_BASENAME}.#{ext}"
		if File.exists?(headerFile)
			@@cache[ext] = IO.read(headerFile, encoding: ENCODING) + "\n"
		else
			@@cache[ext] = ''
		end
	end
end

VENDOR_DIR = 'vendor'
RHINOJAR = File.join('vendor', 'rhino.jar')
JSLINT = File.join('vendor', 'jslint.js')
AJAXMIN = File.join('vendor', 'win', 'AjaxMin.exe')
JSMIN = File.join('vendor', 'unix', 'jsmin')
JSMIN_SOURCE = File.join('vendor', 'unix', 'jsmin.c')

# A list of all files that will be generated by the build task.
# This list of files is used in the 'clean' task to delete only the generated files.
generated_files = []

# Ensure that our input and output directoroes are created.
directory JS_IN_DIR
directory JS_OUT_DIR

# Ensure that we always have a default task.
task :default => [JS_IN_DIR, JS_OUT_DIR]

# Ensure that on *NIX boxes we can minify JavaScript code
# by conditionally compiling jsmin from source.
if Rake.application.unix? && defined? sh
	file JSMIN => [JSMIN_SOURCE] do
		sh "cc -o #{JSMIN} #{JSMIN_SOURCE}"
	end
	task :default => [JSMIN]
end

# Define a method to prepend the header file to
# the specified file.
def prepend_header (file)
	if (!Header.get('js').empty?() && File.exists?(file))
		s = Header.get('js') + IO.read(file, encoding: ENCODING)
		f = File.new(file, 'w')
		f.write(s)
		f.close
	end
end

# Define our minify method to minify a JavaScript source file.
def minify (input, output)
	if Rake.application.windows?
		Kernel.system("#{AJAXMIN} -js #{input} -out #{output} -clobber -comments:none")
		prepend_header(output)
	elsif Rake.application.unix? && defined? sh
		sh "#{JSMIN} < #{input} > #{output}"
		prepend_header(output)
	end
end


##############
# SYNTHESIZE #
##############

=begin
	Creates any missing, nested directory in a directory path.

	@*paths A variadic list of directory paths.
	@return void
=end
def create_dirs_if_missing (*paths)
	paths.each do |path|
		currpath = File.join('.', '')
		path.split(File::SEPARATOR).each do |dir|
			currpath = File.join(currpath, dir)
			Dir.mkdir(currpath) unless File.directory?(currpath)
		end
	end
end

=begin
	Creates a JavaScript module from the specified template JavaScript file.
	For each prerequisite of the specified task the token '{{filename_without_extension}}'
	will attempted to be expanded with the associated prerequisite file. When a
	token is expanded the indentation level will be maintained so that the resulting
	module file will be nicely formatted.

	@task The Rake file task for the JavaScript module.
	@templatePath The full path to the JavaScript module template file.
	@return void
=end
def create_js_module (task, templatePath)
	mod = Header.get('js') + IO.read(templatePath, encoding: ENCODING)

	task.prerequisites.each do |src|
		filename = src.sub(/.*\/(.*)\.js/, '\1')
		s = IO.read(src, encoding: ENCODING)
		s.strip!()
		s.slice!(-1) if s[-1] == ';'
		pattern = /(((^[ \t]*)(var([ \t]+))?).*)?\{\{#{filename}\}\}/u
		pattern =~ mod

		if !$~.nil?
			# maintain the indentation level
			if $~[4].nil?
				s.gsub!(/^/, $~[3])
				s.sub!(/^\s*/, '')
			else
				s.gsub!(/^/, $~[3][0]*($~[3].length + 1))
				s.sub!(/^\s*/, '')
			end

			mod.sub!(pattern, '\1' + s)
		end
	end

	create_dirs_if_missing(File.dirname(task.name))
	f = File.new(task.name, 'w')
	f.write(mod)
	f.close
end

=begin
	Here we synthesize a file task for each JavaScript module. A new task
	will be created for each JavaScript module template file, denoted by
	prefixing a JavaScript file with '_'.

	Dependencies of the JavaScript module task will be determined by examining
	the JavaScript module template file for tokens of the form '{{filename_without_extension}}'.
	Each token will be expanded to a filename in the same directory the JavaScript module
	template was found and if the file exists then it will be added as a dependency.

	This block also creates a file task for minifying the resulting JavaScript module file.
	This file task has the JavaScript module as its only dependency.

	Finally this block adds each newly created file task as a dependency to the 'default' task.
=end
FileList[JS_MODULE_TEMPLATE_GLOB].each do |src|
	path = File.dirname(src)
	extname = File.extname(src)
	filename = File.basename(src, extname)
	js_module_file = File.join(JS_OUT_DIR, "#{filename[1..-1]}#{extname}")
	js_minified_module_file = File.join(JS_OUT_DIR, "#{filename[1..-1]}.min#{extname}")
	s = IO.read(src, encoding: ENCODING)
	pattern = /\{\{(.*)\}\}/
	hasfiles = false
	index = 0

	while data = pattern.match(s, index)
		dependency = File.join(path, "#{data[1]}#{extname}")
		if File.exists?(dependency) and File.readable?(dependency)
			file js_module_file => dependency
			hasfiles = true
		end
		index = data.end(0)
	end

	if hasfiles
		file js_module_file => src
		file js_module_file do |t|
			create_js_module(t, src)
		end

		file js_minified_module_file => js_module_file do |t|
			minify(js_module_file, t.name)
		end

		task :default => [js_module_file, js_minified_module_file]
		generated_files << js_module_file << js_minified_module_file
	end
end


#########
# TASKS #
#########


desc "Deletes all files generated by the build task."
task :clean do |t|
	generated_files.each do |src|
		File.delete(src) if File.exists?(src)
	end
end

desc "Builds all modules and minifies them. Alias for the default task."
task :build => [:default]
desc "Performs a clean then a build."
task :rebuild => [:clean, :build]

desc "Check JavaScript source in the '#{JS_IN_DIR}' with JSLint - exit with status 1 if a file fails."
task :jslint do |t, args|
	FileList["#{JS_IN_DIR}/**/*.js"].exclude("**/_*.js").each do |fname|
		cmd = "java -cp #{RHINOJAR} org.mozilla.javascript.tools.shell.Main #{JSLINT} #{fname}"
		results = %x{#{cmd}}

		unless results.length == 0
			puts "#{fname}:"
			puts results
			exit 1
		end
	end
end