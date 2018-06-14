#!/usr/bin/env python

import os
import json
from niftiMask2Surface import niftiMask2Surface
import pandas as pd

with open('config.json') as config_json:
    config = json.load(config_json)

pwd = os.getcwd()
if not os.stat(pwd + "/surfaces"):
    os.mkdir(pwd + "/surfaces")

#os.chdir(pwd + "/surfaces")

lut = pd.read_csv('FreeSurferColorLUT.csv')
aparcaseg = 'aparc+aseg.nii.gz'
filetype = config["filetype"]

# will contain name, color, filename, and l/r info
# for each surface
surfacesList = []

labels = [2, 41, 4, 43, 10, 11, 12, 13, 14, 15, 16, 17, 18, 49, 50, 51,
          52, 53, 54, 85, 251, 252, 253, 254, 255, 1001, 1002, 1003, 1005,
          1007, 1008, 1009, 1011, 1012, 1013, 1015, 1016, 1017, 1018, 1019, 
          1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031,
          1032, 1033, 1034, 1035, 2001, 2002, 2003, 2005, 2007, 2008, 2009, 2011, 
          2012, 2013, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023,
          2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]
for e in labels:
    info = lut.loc[lut['number'] == str(e)].iloc[0]
    surfname = info['name'] + '.' + filetype
    filename = 'surfaces/' + surfname
    print(info['name'])
    
    surfacesList.append({
        'name': info['name'],
        'color': [
            float(info['R']) / 255,
            float(info['G']) / 255,
            float(info['B']) / 255
        ],
        'filename': surfname,
        'left': bool(info['left']),
        'right': bool(info['right']),
        'filetype': filetype
    })
    niftiMask2Surface(e, aparcaseg, filename, 10, filetype)

with open('surfaces/surfaces.json', 'w') as surfacesJson:
    json.dump(surfacesList, surfacesJson)