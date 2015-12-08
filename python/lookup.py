import os
import urllib
import time

api_key = os.environ['DICTIONARY_API_KEY']
dictionaries = ['dictionaries/new-additions.txt', 'dictionaries/english-words.txt', '/usr/share/dict/words']
definition_url = 'http://www.dictionaryapi.com/api/v1/references/collegiate/xml/{1}?key={0}'
downloads = './data'
x = 0

for dictionary in dictionaries:
	if os.path.isfile(dictionary):
		with open(dictionary, 'r') as dict:
			for word in dict:
				word_file = os.path.join(downloads, word.strip() + ".xml")
				
				try:
					if not os.path.isfile(word_file):
						urllib.urlretrieve(definition_url.format(api_key, word.strip()), word_file)
						print (str(x) + ") " + word.strip())
				except:
					print ("Could not download " + word)

				x+=1
	else:
		print ("Skipping dictionary. Could not find " + dictionary)