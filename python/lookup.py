import os
import urllib
import time

api_key = os.environ['DICTIONARY_API_KEY']
dictionary = '/usr/share/dict/words'
definition_url = 'http://www.dictionaryapi.com/api/v1/references/collegiate/xml/{1}?key={0}'
downloads = './data'
x = 0

with open(dictionary, 'r') as dict:
	for word in dict:
		word_file = os.path.join(downloads, word.strip() + ".xml")
		
		try:
			if not os.path.isfile(word_file):
				urllib.urlretrieve(definition_url.format(api_key, word.strip()), word_file)
				x+=1
				print (str(x) + ") " + word.strip())
		except:
			print ("Could not download " + word)