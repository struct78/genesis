import os, os.path
import csv
import re
import shutil
import xml.etree.ElementTree as ET
import argparse
import itertools
import timeit
from operator import itemgetter
from collections import Counter, defaultdict
from lxml import etree
from multiprocessing import Process, Pool

time_start = timeit.default_timer()

alpha_numeric = ['1','2','3','4','5','6','7','8','9','0','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
downloads = './data'
parsed_folder = './parsed'
web_folder = '../web/src/data/'

date_formats = (
	{'exp':r'^(\d{1,4})$','rep':r'\g<1>', 'name':'XXXX', 'type':'1'},
	{'exp':r'^(\d{1,2})(th\scentury)$',r'rep':r'\g<1>00', 'name':'XXth Century', 'type':'2'},
	{'exp':r'^(circa\s)(\d{1,4})$','rep':r'\g<2>', 'name':'circa XXXX', 'type':'3'},
	{'exp':r'^(before\s)(\d{1,2})(th\scentury)$','rep':r'\g<2>00', 'name':'before XXTH century', 'type':'4'}
)

headers = ['id','word','parent','year','type','word_type','obsolescence']

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

def process_files(letter):
	print "Starting " + letter
	word_list = []
	for base_folder, _, files in os.walk(os.path.join(downloads, letter.upper())):
		for f in files:
			word = os.path.join(base_folder, f)
			filename, extension = os.path.splitext(word)

			if (extension == '.xml'):
				try:
					parser = etree.XMLParser(recover=True)
					tree = ET.parse(word, parser=parser)
					root = tree.getroot()

					if root.find('entry/def/date') is not None:
						shutil.copyfile(word, os.path.join(parsed_folder, filename[0].upper(), f))
					
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
									is_obsolete = 0

									if (entry.findall('fl')):
										word_type = entry.find('fl').text

									if (definition.findall('ssl')):
										if (definition.find('ssl').text=='obsolete'):
											is_obsolete = 1

									if (definition.findall('sl')):
										if (definition.find('sl').text=='obsolete'):
											is_obsolete = 1

									row = [id, full_word.encode("utf-8"), parent.encode("utf-8"), normalised_date, date_type, word_type, is_obsolete]
									word_list.append(row)
				except:
					print "Failed on " + word

	print "Finished " + letter
	return word_list

def main():
	pool = Pool(processes=4)
	results = pool.map(process_files, alpha_numeric)

	print "All processes finished"

	words = sorted([list(tup) for tup in set([tuple(row) for row in list(itertools.chain.from_iterable(results))])], key = itemgetter(3, 5, 1))
	words.insert(0, headers)

	print "Saving file"
	
	with open(os.path.join(web_folder, "words.csv"), "w") as source:
		writer = csv.writer(source, quoting=csv.QUOTE_ALL)
		writer.writerows(words)

	print "Done"

	time_end = timeit.default_timer()

	print "Time elapsed: " + str(time_end-time_start) + " seconds"
		
if __name__ == "__main__":
	main()
