require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'net/https'
require 'uri'

#Just redirect to the test page.
get '/' do
	redirect to('/index.html')
end

=begin
	Can use this route to proxy requests made to GitHub.

	By using this route you can POST a 'uri' parameter
	that points to GitHub (say a raw .json file containing
	the tests for mustache) via Ajax.
=end
post '/proxy' do
	stream do |out|
		uri = URI.parse(params[:uri])
		http = Net::HTTP.new(uri.host, uri.port)

		if uri.scheme == 'https'
			http.use_ssl = true
			http.verify_mode = OpenSSL::SSL::VERIFY_NONE
		end

		http.start do
		  http.request_get(uri.path) do |res|
		    out << res.body
		  end
		end
	end
end