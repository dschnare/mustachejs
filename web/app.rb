require 'rubygems'
require 'bundler/setup'
require 'sinatra'

get '/' do
	redirect to('/index.html')
end