import os
import urllib
import time
from multiprocessing import Process, Pool

api_key = os.environ['DICTIONARY_API_KEY']
alpha_numeric = ['1','2','3','4','5','6','7','8','9','0','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
dictionaries = ['dictionaries/new-additions.txt', 'dictionaries/english-words.txt', '/usr/share/dict/words']
directories = ['data','parsed']
definition_url = 'http://www.dictionaryapi.com/api/v1/references/collegiate/xml/{1}?key={0}'
downloads = './data'
x = 0

def lookup(dictionary):
	if os.path.isfile(dictionary):
		with open(dictionary, 'r') as dict:
			for word in dict:
				evaluate(word)
	else:
		print ("Skipping dictionary. Could not find " + dictionary)

def evaluate(word):
	global x
	word_file = os.path.join(downloads, word[0].upper(), word.strip() + ".xml")
				
	try:
		if not os.path.isfile(word_file):
			urllib.urlretrieve(definition_url.format(api_key, word.strip()), word_file)
			print (str(x) + ") " + word.strip())
	except:
		print ("Could not download " + word)

	x+=1

for directory in directories:
	for letter in alpha_numeric: 
		if not os.path.exists(directory + '/' + letter):
			os.makedirs(directory + '/' + letter)

pool = Pool(processes=5)
results = pool.map(lookup, dictionaries)