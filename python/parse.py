import os, os.path
import csv
import re
import shutil
import xml.etree.ElementTree as ET
import argparse
import itertools
from operator import itemgetter
from collections import Counter, defaultdict
from lxml import etree

downloads = './data'
parsed = './parsed'
csv_folder = './csv'
web_folder = '../web/src/data/'

date_formats = (
	{'exp':r'^(\d{1,4})$','rep':r'\g<1>', 'name':'XXXX', 'type':'1'},
	{'exp':r'^(\d{1,2})(th\scentury)$',r'rep':r'\g<1>00', 'name':'XXth Century', 'type':'2'},
	{'exp':r'^(circa\s)(\d{1,4})$','rep':r'\g<2>', 'name':'circa XXXX', 'type':'3'},
	{'exp':r'^(before\s)(\d{1,2})(th\scentury)$','rep':r'\g<2>00', 'name':'before XXTH century', 'type':'4'})

words = []
headers = ['id','word','parent','year','type','word_type']

def getKey(item):
	return item[2]

def normalise(date):
	for regex in date_formats:
		if re.search(regex['exp'], date):
			return re.sub(regex['exp'], regex['rep'], date)

	return date

def get_type(date):
	for regex in reversed(date_formats):
		if re.search(regex['exp'], date):
			return regex['type']

	return 0

def main():
	global words
	for base_folder, _, files in os.walk(downloads):
		for f in files:
			word = os.path.join(base_folder, f)
			filename, extension = os.path.splitext(word)

			if (extension == '.xml'):
				parser = etree.XMLParser(recover=True)
				tree = ET.parse(word, parser=parser)
				root = tree.getroot()

				print("Opening " + word)
				if root.find('entry/def/date') is not None:
					shutil.copyfile(word, os.path.join(parsed, f))
				
					for entry in root.findall('entry'):
						for definition in entry.findall('def'):
							if (definition.findall('date')):
								parent = os.path.basename(f)
								parent = os.path.splitext(parent)[0]
								id = entry.get('id')
								full_word = entry.find('ew').text
								orig_date = definition.find('date').text
								normalised_date = normalise(orig_date)
								date_type = get_type(orig_date)
								word_type = None

								if (entry.findall('fl')):
									word_type = entry.find('fl').text

								row = [id, full_word, parent, normalised_date, date_type, word_type]
								words.append(row)

	words = sorted([list(tup) for tup in set([tuple(row) for row in words])], key = itemgetter(3, 5, 1))

	words.insert(0, headers)

	with open(os.path.join(web_folder, "words.csv"), "w") as source:
		writer = csv.writer(source, quoting=csv.QUOTE_ALL)
		writer.writerows(words)
		
if __name__ == "__main__":
	main()
